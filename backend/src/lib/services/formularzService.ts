import { getDb } from '../db';
import type { Formularz, FormularzInput, FiltryFormularzy, StatusFormularza } from '../types';
import { pobierzZadanie } from './zadanieService';

// TODO: Dodac paginacje
export function pobierzFormularze(filtry: FiltryFormularzy = {}): Formularz[] {
  const db = getDb();

  let sql = 'SELECT * FROM formularze WHERE 1=1';
  const params: (string | number)[] = [];

  if (filtry.zadanie_id !== undefined) {
    sql += ' AND zadanie_id = ?';
    params.push(filtry.zadanie_id);
  }
  if (filtry.departament_id !== undefined) {
    sql += ' AND departament_id = ?';
    params.push(filtry.departament_id);
  }
  if (filtry.status !== undefined) {
    sql += ' AND status = ?';
    params.push(filtry.status);
  }
  if (filtry.kod_rozdzialu !== undefined) {
    sql += ' AND kod_rozdzialu = ?';
    params.push(filtry.kod_rozdzialu);
  }
  if (filtry.kod_paragrafu !== undefined) {
    sql += ' AND kod_paragrafu = ?';
    params.push(filtry.kod_paragrafu);
  }
  if (filtry.kod_dzialania !== undefined) {
    sql += ' AND kod_dzialania = ?';
    params.push(filtry.kod_dzialania);
  }
  if (filtry.kategoria !== undefined) {
    sql += ' AND kategoria = ?';
    params.push(filtry.kategoria);
  }
  if (filtry.priorytet !== undefined) {
    sql += ' AND priorytet = ?';
    params.push(filtry.priorytet);
  }
  if (filtry.typ_wydatku !== undefined) {
    sql += ' AND typ_wydatku = ?';
    params.push(filtry.typ_wydatku);
  }
  if (filtry.zrodlo_finansowania !== undefined) {
    sql += ' AND zrodlo_finansowania = ?';
    params.push(filtry.zrodlo_finansowania);
  }

  // TODO: Dodac filtry kwota_min, kwota_max dla wybranego roku

  sql += ' ORDER BY created_at DESC';

  return db.prepare(sql).all(...params) as Formularz[];
}

export function pobierzFormularz(id: number): Formularz | null {
  const db = getDb();
  return db.prepare('SELECT * FROM formularze WHERE id = ?').get(id) as Formularz | null;
}

export function pobierzFormularzeDepartamentu(
  zadanieId: number,
  departamentId: number,
  status?: StatusFormularza
): Formularz[] {
  const db = getDb();
  if (status) {
    return db.prepare(
      'SELECT * FROM formularze WHERE zadanie_id = ? AND departament_id = ? AND status = ? ORDER BY created_at DESC'
    ).all(zadanieId, departamentId, status) as Formularz[];
  }
  return db.prepare(
    'SELECT * FROM formularze WHERE zadanie_id = ? AND departament_id = ? ORDER BY created_at DESC'
  ).all(zadanieId, departamentId) as Formularz[];
}

export function utworzFormularz(input: FormularzInput): Formularz {
  const db = getDb();

  // Pobierz aktualna wersje zadania
  const zadanie = pobierzZadanie(input.zadanie_id);
  if (!zadanie) {
    throw new Error('Zadanie nie istnieje');
  }
  if (zadanie.status !== 'active') {
    throw new Error('Zadanie jest zamkniete');
  }

  const result = db.prepare(`
    INSERT INTO formularze (
      zadanie_id, departament_id, status, zadanie_wersja,
      kod_rozdzialu, kod_paragrafu, kod_dzialania, nazwa_zadania,
      kategoria, priorytet, rok_1, rok_2, rok_3, rok_4,
      typ_wydatku, zrodlo_finansowania, jednostka_realizujaca,
      opis_szczegolowy, uzasadnienie, uwagi, zalaczniki_ref,
      osoba_odpowiedzialna, telefon_kontaktowy, email_kontaktowy,
      data_rozpoczecia, data_zakonczenia, wskazniki_realizacji
    ) VALUES (
      ?, ?, 'draft', ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?
    )
  `).run(
    input.zadanie_id, input.departament_id, zadanie.wersja,
    input.kod_rozdzialu ?? null, input.kod_paragrafu ?? null, input.kod_dzialania ?? null, input.nazwa_zadania ?? null,
    input.kategoria ?? null, input.priorytet ?? null, input.rok_1 ?? null, input.rok_2 ?? null, input.rok_3 ?? null, input.rok_4 ?? null,
    input.typ_wydatku ?? null, input.zrodlo_finansowania ?? null, input.jednostka_realizujaca ?? null,
    input.opis_szczegolowy ?? null, input.uzasadnienie ?? null, input.uwagi ?? null, input.zalaczniki_ref ?? null,
    input.osoba_odpowiedzialna ?? null, input.telefon_kontaktowy ?? null, input.email_kontaktowy ?? null,
    input.data_rozpoczecia ?? null, input.data_zakonczenia ?? null, input.wskazniki_realizacji ?? null
  );

  return pobierzFormularz(result.lastInsertRowid as number)!;
}

export function aktualizujFormularz(id: number, input: Partial<FormularzInput>): Formularz | null {
  const db = getDb();

  const formularz = pobierzFormularz(id);
  if (!formularz) return null;
  if (formularz.status !== 'draft') {
    throw new Error('Nie mozna edytowac formularza ktory nie jest w statusie draft');
  }

  // TODO: Dynamiczne budowanie UPDATE tylko dla podanych pol
  db.prepare(`
    UPDATE formularze SET
      kod_rozdzialu = COALESCE(?, kod_rozdzialu),
      kod_paragrafu = COALESCE(?, kod_paragrafu),
      kod_dzialania = COALESCE(?, kod_dzialania),
      nazwa_zadania = COALESCE(?, nazwa_zadania),
      kategoria = COALESCE(?, kategoria),
      priorytet = COALESCE(?, priorytet),
      rok_1 = COALESCE(?, rok_1),
      rok_2 = COALESCE(?, rok_2),
      rok_3 = COALESCE(?, rok_3),
      rok_4 = COALESCE(?, rok_4),
      typ_wydatku = COALESCE(?, typ_wydatku),
      zrodlo_finansowania = COALESCE(?, zrodlo_finansowania),
      jednostka_realizujaca = COALESCE(?, jednostka_realizujaca),
      opis_szczegolowy = COALESCE(?, opis_szczegolowy),
      uzasadnienie = COALESCE(?, uzasadnienie),
      uwagi = COALESCE(?, uwagi),
      zalaczniki_ref = COALESCE(?, zalaczniki_ref),
      osoba_odpowiedzialna = COALESCE(?, osoba_odpowiedzialna),
      telefon_kontaktowy = COALESCE(?, telefon_kontaktowy),
      email_kontaktowy = COALESCE(?, email_kontaktowy),
      data_rozpoczecia = COALESCE(?, data_rozpoczecia),
      data_zakonczenia = COALESCE(?, data_zakonczenia),
      wskazniki_realizacji = COALESCE(?, wskazniki_realizacji),
      version = version + 1
    WHERE id = ?
  `).run(
    input.kod_rozdzialu, input.kod_paragrafu, input.kod_dzialania, input.nazwa_zadania,
    input.kategoria, input.priorytet, input.rok_1, input.rok_2, input.rok_3, input.rok_4,
    input.typ_wydatku, input.zrodlo_finansowania, input.jednostka_realizujaca,
    input.opis_szczegolowy, input.uzasadnienie, input.uwagi, input.zalaczniki_ref,
    input.osoba_odpowiedzialna, input.telefon_kontaktowy, input.email_kontaktowy,
    input.data_rozpoczecia, input.data_zakonczenia, input.wskazniki_realizacji,
    id
  );

  return pobierzFormularz(id);
}

export function wyslijFormularz(id: number): Formularz | null {
  const db = getDb();

  const formularz = pobierzFormularz(id);
  if (!formularz) return null;
  if (formularz.status !== 'draft') {
    throw new Error('Mozna wyslac tylko formularz w statusie draft');
  }

  // TODO: Tutaj wywolac walidacje przed wyslaniem

  db.prepare(`
    UPDATE formularze SET
      status = 'submitted',
      submitted_at = datetime('now')
    WHERE id = ?
  `).run(id);

  return pobierzFormularz(id);
}

export function usunFormularz(id: number): boolean {
  const db = getDb();

  const formularz = pobierzFormularz(id);
  if (!formularz) return false;
  if (formularz.status !== 'draft') {
    throw new Error('Mozna usunac tylko formularz w statusie draft');
  }

  const result = db.prepare('DELETE FROM formularze WHERE id = ?').run(id);
  return result.changes > 0;
}

export function oznaczJakoHistoryczny(id: number): boolean {
  const db = getDb();
  const result = db.prepare("UPDATE formularze SET status = 'historical' WHERE id = ?").run(id);
  return result.changes > 0;
}

// Wysyla wszystkie drafty departamentu dla danego zadania
export function wyslijWszystkieFormularzeDepartamentu(zadanieId: number, departamentId: number): number {
  const db = getDb();

  // TODO: Walidacja wszystkich formularzy przed wyslaniem?

  const result = db.prepare(`
    UPDATE formularze 
    SET 
      status = 'submitted', 
      submitted_at = datetime('now')
    WHERE 
      zadanie_id = ? 
      AND departament_id = ? 
      AND status = 'draft'
  `).run(zadanieId, departamentId);

  return result.changes;
}

// Suma kwot dla departamentu w ramach zadania
export function obliczSumeDepartamentu(zadanieId: number, departamentId: number): {
  suma_rok_1: number;
  suma_rok_2: number;
  suma_rok_3: number;
  suma_rok_4: number;
  suma_calkowita: number;
} {
  const db = getDb();
  const result = db.prepare(`
    SELECT
      COALESCE(SUM(rok_1), 0) as suma_rok_1,
      COALESCE(SUM(rok_2), 0) as suma_rok_2,
      COALESCE(SUM(rok_3), 0) as suma_rok_3,
      COALESCE(SUM(rok_4), 0) as suma_rok_4
    FROM formularze
    WHERE zadanie_id = ? AND departament_id = ? AND status = 'submitted'
  `).get(zadanieId, departamentId) as {
    suma_rok_1: number;
    suma_rok_2: number;
    suma_rok_3: number;
    suma_rok_4: number;
  };

  return {
    ...result,
    suma_calkowita: result.suma_rok_1 + result.suma_rok_2 + result.suma_rok_3 + result.suma_rok_4
  };
}
