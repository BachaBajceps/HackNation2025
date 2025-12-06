import { getDb, transaction } from '../db';
import type {
  WysylkaDepartamentu,
  WysylkaZDepartamentem,
  Formularz,
  Departament,
  WynikWalidacji,
  StatusWysylki
} from '../types';
import { pobierzZadanie } from './zadanieService';
import { walidujWysylkeZbiorcza } from '../validators/budzet';

export function pobierzWysylke(id: number): WysylkaDepartamentu | null {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM wysylki_departamentow WHERE id = ?'
  ).get(id) as WysylkaDepartamentu | null;
}

export function pobierzWysylkiZadania(zadanieId: number): WysylkaZDepartamentem[] {
  const db = getDb();
  const wysylki = db.prepare(`
    SELECT w.*, d.nazwa as dep_nazwa, d.kod as dep_kod
    FROM wysylki_departamentow w
    JOIN departamenty d ON d.id = w.departament_id
    WHERE w.zadanie_id = ?
    ORDER BY w.created_at DESC
  `).all(zadanieId) as (WysylkaDepartamentu & { dep_nazwa: string; dep_kod: string })[];

  return wysylki.map(w => ({
    ...w,
    departament: { id: w.departament_id, nazwa: w.dep_nazwa, kod: w.dep_kod }
  }));
}

export function pobierzAktualnaWysylkeDepartamentu(
  zadanieId: number,
  departamentId: number
): WysylkaDepartamentu | null {
  const db = getDb();
  const zadanie = pobierzZadanie(zadanieId);
  if (!zadanie) return null;

  return db.prepare(`
    SELECT * FROM wysylki_departamentow
    WHERE zadanie_id = ? AND departament_id = ? AND zadanie_wersja = ?
  `).get(zadanieId, departamentId, zadanie.wersja) as WysylkaDepartamentu | null;
}

export function pobierzDraftyDepartamentu(zadanieId: number, departamentId: number): Formularz[] {
  const db = getDb();
  const zadanie = pobierzZadanie(zadanieId);
  if (!zadanie) return [];

  return db.prepare(`
    SELECT * FROM formularze
    WHERE zadanie_id = ? AND departament_id = ? AND status = 'draft' AND zadanie_wersja = ?
    ORDER BY created_at DESC
  `).all(zadanieId, departamentId, zadanie.wersja) as Formularz[];
}

export function obliczSumyDraftow(zadanieId: number, departamentId: number): {
  liczba: number;
  suma_rok_1: number;
  suma_rok_2: number;
  suma_rok_3: number;
  suma_rok_4: number;
} {
  const db = getDb();
  const zadanie = pobierzZadanie(zadanieId);
  if (!zadanie) return { liczba: 0, suma_rok_1: 0, suma_rok_2: 0, suma_rok_3: 0, suma_rok_4: 0 };

  const result = db.prepare(`
    SELECT
      COUNT(*) as liczba,
      COALESCE(SUM(rok_1), 0) as suma_rok_1,
      COALESCE(SUM(rok_2), 0) as suma_rok_2,
      COALESCE(SUM(rok_3), 0) as suma_rok_3,
      COALESCE(SUM(rok_4), 0) as suma_rok_4
    FROM formularze
    WHERE zadanie_id = ? AND departament_id = ? AND status = 'draft' AND zadanie_wersja = ?
  `).get(zadanieId, departamentId, zadanie.wersja) as {
    liczba: number;
    suma_rok_1: number;
    suma_rok_2: number;
    suma_rok_3: number;
    suma_rok_4: number;
  };

  return result;
}

// Glowna funkcja - wysylka zbiorcza wszystkich draftow departamentu
export function wyslijFormularzeDepartamentu(
  zadanieId: number,
  departamentId: number
): { success: boolean; wysylka?: WysylkaDepartamentu; walidacja: WynikWalidacji } {

  const zadanie = pobierzZadanie(zadanieId);
  if (!zadanie) {
    return {
      success: false,
      walidacja: { valid: false, bledy: ['Zadanie nie istnieje'], ostrzezenia: [] }
    };
  }

  if (zadanie.status !== 'active') {
    return {
      success: false,
      walidacja: { valid: false, bledy: ['Zadanie jest zamkniete'], ostrzezenia: [] }
    };
  }

  const drafty = pobierzDraftyDepartamentu(zadanieId, departamentId);
  if (drafty.length === 0) {
    return {
      success: false,
      walidacja: { valid: false, bledy: ['Brak formularzy do wyslania'], ostrzezenia: [] }
    };
  }

  // Walidacja zbiorcza
  const walidacja = walidujWysylkeZbiorcza(zadanieId, departamentId, drafty);
  if (!walidacja.valid) {
    return { success: false, walidacja };
  }

  // Wszystko OK - wysylamy w transakcji
  return transaction((db) => {
    const sumy = obliczSumyDraftow(zadanieId, departamentId);

    // Utworz rekord wysylki
    const wysylkaResult = db.prepare(`
      INSERT INTO wysylki_departamentow (
        zadanie_id, departament_id, zadanie_wersja, status,
        liczba_formularzy, suma_rok_1, suma_rok_2, suma_rok_3, suma_rok_4,
        wyslano_at
      ) VALUES (?, ?, ?, 'wyslano', ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      zadanieId, departamentId, zadanie.wersja,
      sumy.liczba, sumy.suma_rok_1, sumy.suma_rok_2, sumy.suma_rok_3, sumy.suma_rok_4
    );

    const wysylkaId = wysylkaResult.lastInsertRowid as number;

    // Zaktualizuj wszystkie drafty na submitted
    db.prepare(`
      UPDATE formularze
      SET status = 'submitted', wysylka_id = ?, submitted_at = datetime('now')
      WHERE zadanie_id = ? AND departament_id = ? AND status = 'draft' AND zadanie_wersja = ?
    `).run(wysylkaId, zadanieId, departamentId, zadanie.wersja);

    const wysylka = pobierzWysylke(wysylkaId)!;
    return { success: true, wysylka, walidacja };
  });
}

// Ministerstwo zmienia zadanie - oznacz wysylke jako wymagajaca korekty
export function oznaczWymagaKorekty(zadanieId: number, departamentId: number): boolean {
  const db = getDb();
  const zadanie = pobierzZadanie(zadanieId);
  if (!zadanie) return false;

  const result = db.prepare(`
    UPDATE wysylki_departamentow
    SET status = 'wymaga_korekty'
    WHERE zadanie_id = ? AND departament_id = ? AND zadanie_wersja = ? AND status = 'wyslano'
  `).run(zadanieId, departamentId, zadanie.wersja);

  return result.changes > 0;
}

// Utworz kopie formularzy jako drafty dla nowej wersji zadania
export function utworzKopieDoKorekty(zadanieId: number, departamentId: number, nowaWersja: number): Formularz[] {
  const db = getDb();

  // Pobierz ostatnio wyslane formularze
  const wyslane = db.prepare(`
    SELECT * FROM formularze
    WHERE zadanie_id = ? AND departament_id = ? AND status = 'submitted'
    ORDER BY submitted_at DESC
  `).all(zadanieId, departamentId) as Formularz[];

  // Unikalne formularze (najnowsze)
  const unikalne = new Map<number, Formularz>();
  for (const f of wyslane) {
    if (!unikalne.has(f.id)) {
      unikalne.set(f.id, f);
    }
  }

  const kopie: Formularz[] = [];

  const insertStmt = db.prepare(`
    INSERT INTO formularze (
      zadanie_id, departament_id, status, parent_formularz_id, zadanie_wersja,
      kod_rozdzialu, kod_paragrafu, kod_dzialania, nazwa_zadania,
      kategoria, priorytet, rok_1, rok_2, rok_3, rok_4,
      typ_wydatku, zrodlo_finansowania, jednostka_realizujaca,
      opis_szczegolowy, uzasadnienie, uwagi, zalaczniki_ref,
      osoba_odpowiedzialna, telefon_kontaktowy, email_kontaktowy,
      data_rozpoczecia, data_zakonczenia, wskazniki_realizacji
    ) VALUES (
      ?, ?, 'draft', ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?
    )
  `);

  for (const f of unikalne.values()) {
    const result = insertStmt.run(
      f.zadanie_id, f.departament_id, f.id, nowaWersja,
      f.kod_rozdzialu, f.kod_paragrafu, f.kod_dzialania, f.nazwa_zadania,
      f.kategoria, f.priorytet, f.rok_1, f.rok_2, f.rok_3, f.rok_4,
      f.typ_wydatku, f.zrodlo_finansowania, f.jednostka_realizujaca,
      f.opis_szczegolowy, f.uzasadnienie, f.uwagi, f.zalaczniki_ref,
      f.osoba_odpowiedzialna, f.telefon_kontaktowy, f.email_kontaktowy,
      f.data_rozpoczecia, f.data_zakonczenia, f.wskazniki_realizacji
    );

    kopie.push(db.prepare('SELECT * FROM formularze WHERE id = ?').get(result.lastInsertRowid) as Formularz);
  }

  // Oznacz stare wyslane jako historyczne
  db.prepare(`
    UPDATE formularze SET status = 'historical'
    WHERE zadanie_id = ? AND departament_id = ? AND status = 'submitted'
  `).run(zadanieId, departamentId);

  return kopie;
}

// Monitoring - status wszystkich departamentow dla zadania
export function pobierzStatusDepartamentow(zadanieId: number): {
  departament: Departament;
  wysylka: WysylkaDepartamentu | null;
  liczba_draftow: number;
  suma_draftow: number;
  limit: number;
}[] {
  const db = getDb();
  const zadanie = pobierzZadanie(zadanieId);
  if (!zadanie) return [];

  const departamenty = db.prepare(`
    SELECT d.*, COALESCE(l.limit_budzetu, 0) as limit_budzetu
    FROM departamenty d
    LEFT JOIN limity_departamentow l ON l.departament_id = d.id AND l.zadanie_id = ?
  `).all(zadanieId) as (Departament & { limit_budzetu: number })[];

  return departamenty.map(dep => {
    const wysylka = db.prepare(`
      SELECT * FROM wysylki_departamentow
      WHERE zadanie_id = ? AND departament_id = ? AND zadanie_wersja = ?
    `).get(zadanieId, dep.id, zadanie.wersja) as WysylkaDepartamentu | null;

    const draftStats = db.prepare(`
      SELECT COUNT(*) as liczba, COALESCE(SUM(rok_1), 0) as suma
      FROM formularze
      WHERE zadanie_id = ? AND departament_id = ? AND status = 'draft' AND zadanie_wersja = ?
    `).get(zadanieId, dep.id, zadanie.wersja) as { liczba: number; suma: number };

    return {
      departament: { id: dep.id, nazwa: dep.nazwa, kod: dep.kod },
      wysylka,
      liczba_draftow: draftStats.liczba,
      suma_draftow: draftStats.suma,
      limit: dep.limit_budzetu
    };
  });
}
