import { getDb, transaction } from '../db';
import type {
  Zadanie,
  ZadanieZLimitami,
  LimitDepartamentu,
  StatusZadania,
  NoweZadanieInput,
  AktualizacjaZadaniaInput,
  OgraniczenieZadania
} from '../types';
import { dodajWieleOgraniczen, pobierzOgraniczeniaZadania, dezaktywujWszystkieOgraniczenia } from './ograniczenieService';
import { oznaczWymagaKorekty, utworzKopieDoKorekty } from './wysylkaService';

export function pobierzWszystkieZadania(status?: StatusZadania): Zadanie[] {
  const db = getDb();
  if (status) {
    return db.prepare('SELECT * FROM zadania WHERE status = ? ORDER BY created_at DESC').all(status) as Zadanie[];
  }
  return db.prepare('SELECT * FROM zadania ORDER BY created_at DESC').all() as Zadanie[];
}

export function pobierzZadanie(id: number): Zadanie | null {
  const db = getDb();
  return db.prepare('SELECT * FROM zadania WHERE id = ?').get(id) as Zadanie | null;
}

export function pobierzZadanieZLimitami(id: number): ZadanieZLimitami | null {
  const db = getDb();
  const zadanie = db.prepare('SELECT * FROM zadania WHERE id = ?').get(id) as Zadanie | null;
  if (!zadanie) return null;

  const limity = db.prepare('SELECT * FROM limity_departamentow WHERE zadanie_id = ?').all(id) as LimitDepartamentu[];
  const ograniczenia = pobierzOgraniczeniaZadania(id);

  return { ...zadanie, limity, ograniczenia };
}

export function pobierzLimitDlaDepartamentu(zadanieId: number, departamentId: number): number {
  const db = getDb();
  const result = db.prepare(
    'SELECT limit_budzetu FROM limity_departamentow WHERE zadanie_id = ? AND departament_id = ?'
  ).get(zadanieId, departamentId) as { limit_budzetu: number } | undefined;
  return result?.limit_budzetu ?? 0;
}

export function utworzZadanie(input: NoweZadanieInput): ZadanieZLimitami {
  return transaction((db) => {
    const result = db.prepare(
      'INSERT INTO zadania (tytul, opis, termin_do) VALUES (?, ?, ?)'
    ).run(input.tytul, input.opis || null, input.termin_do);

    const zadanieId = result.lastInsertRowid as number;

    // Dodaj limity
    const insertLimit = db.prepare(
      'INSERT INTO limity_departamentow (zadanie_id, departament_id, limit_budzetu) VALUES (?, ?, ?)'
    );

    for (const limit of input.limity) {
      insertLimit.run(zadanieId, limit.departament_id, limit.limit_budzetu);
    }

    // Dodaj ograniczenia
    if (input.ograniczenia && input.ograniczenia.length > 0) {
      dodajWieleOgraniczen(zadanieId, input.ograniczenia);
    }

    // Zapisz do historii
    zapiszHistorie(zadanieId, 1, 'utworzenie', 'Utworzono zadanie', null, JSON.stringify(input));

    return pobierzZadanieZLimitami(zadanieId)!;
  });
}

// Aktualizacja zadania - tworzy nowa wersje i wymusza korekty
export function aktualizujZadanie(id: number, input: AktualizacjaZadaniaInput): ZadanieZLimitami | null {
  const zadanie = pobierzZadanie(id);
  if (!zadanie) return null;

  return transaction((db) => {
    const nowaWersja = zadanie.wersja + 1;
    const stareDane = JSON.stringify(pobierzZadanieZLimitami(id));

    // Aktualizuj zadanie
    db.prepare(`
      UPDATE zadania SET
        tytul = COALESCE(?, tytul),
        opis = COALESCE(?, opis),
        termin_do = COALESCE(?, termin_do),
        wersja = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(input.tytul, input.opis, input.termin_do, nowaWersja, id);

    // Aktualizuj limity jesli podane
    if (input.limity) {
      // Usun stare limity
      db.prepare('DELETE FROM limity_departamentow WHERE zadanie_id = ?').run(id);

      // Dodaj nowe
      const insertLimit = db.prepare(
        'INSERT INTO limity_departamentow (zadanie_id, departament_id, limit_budzetu) VALUES (?, ?, ?)'
      );
      for (const limit of input.limity) {
        insertLimit.run(id, limit.departament_id, limit.limit_budzetu);
      }
    }

    // Aktualizuj ograniczenia jesli podane
    if (input.ograniczenia) {
      dezaktywujWszystkieOgraniczenia(id);
      dodajWieleOgraniczen(id, input.ograniczenia);
    }

    // Oznacz wszystkie wysylki jako wymagajace korekty
    const wysylki = db.prepare(`
      SELECT DISTINCT departament_id FROM wysylki_departamentow
      WHERE zadanie_id = ? AND status = 'wyslano'
    `).all(id) as { departament_id: number }[];

    for (const w of wysylki) {
      oznaczWymagaKorekty(id, w.departament_id);
      // Utworz kopie formularzy jako drafty
      utworzKopieDoKorekty(id, w.departament_id, nowaWersja);
    }

    // Zapisz do historii
    const noweDane = JSON.stringify(pobierzZadanieZLimitami(id));
    zapiszHistorie(id, nowaWersja, 'aktualizacja', 'Zaktualizowano zadanie - wymagana korekta', stareDane, noweDane);

    return pobierzZadanieZLimitami(id)!;
  });
}

export function zamknijZadanie(id: number): boolean {
  const db = getDb();
  const zadanie = pobierzZadanie(id);
  if (!zadanie) return false;

  const result = db.prepare('UPDATE zadania SET status = ? WHERE id = ?').run('closed', id);

  if (result.changes > 0) {
    zapiszHistorie(id, zadanie.wersja, 'zamkniecie', 'Zamknieto zadanie', null, null);
  }

  return result.changes > 0;
}

export function usunZadanie(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM zadania WHERE id = ?').run(id);
  return result.changes > 0;
}

// Historia zmian
function zapiszHistorie(
  zadanieId: number,
  wersja: number,
  typ: string,
  opis: string,
  stareDane: string | null,
  noweDane: string | null
): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO zadania_historia (zadanie_id, wersja, zmiana_typ, zmiana_opis, stare_dane, nowe_dane)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(zadanieId, wersja, typ, opis, stareDane, noweDane);
}

export function pobierzHistorieZadania(zadanieId: number): {
  id: number;
  wersja: number;
  zmiana_typ: string;
  zmiana_opis: string;
  created_at: string;
}[] {
  const db = getDb();
  return db.prepare(`
    SELECT id, wersja, zmiana_typ, zmiana_opis, created_at
    FROM zadania_historia
    WHERE zadanie_id = ?
    ORDER BY created_at DESC
  `).all(zadanieId) as {
    id: number;
    wersja: number;
    zmiana_typ: string;
    zmiana_opis: string;
    created_at: string;
  }[];
}
