import { getDb } from '../db';
import type { OgraniczenieZadania, OgraniczenieInput } from '../types';

export function pobierzOgraniczeniaZadania(zadanieId: number): OgraniczenieZadania[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM ograniczenia_zadania WHERE zadanie_id = ? AND aktywne = 1'
  ).all(zadanieId) as OgraniczenieZadania[];
}

export function pobierzOgraniczenie(id: number): OgraniczenieZadania | null {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM ograniczenia_zadania WHERE id = ?'
  ).get(id) as OgraniczenieZadania | null;
}

export function dodajOgraniczenie(zadanieId: number, input: OgraniczenieInput): OgraniczenieZadania {
  const db = getDb();

  const result = db.prepare(`
    INSERT INTO ograniczenia_zadania (
      zadanie_id, nazwa, opis, typ,
      warunek_pole, warunek_operator, warunek_wartosc,
      ograniczenie_pole, ograniczenie_operator, ograniczenie_wartosc,
      komunikat_bledu
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    zadanieId,
    input.nazwa,
    input.opis ?? null,
    input.typ,
    input.warunek_pole ?? null,
    input.warunek_operator ?? null,
    input.warunek_wartosc ?? null,
    input.ograniczenie_pole ?? null,
    input.ograniczenie_operator ?? null,
    input.ograniczenie_wartosc ?? null,
    input.komunikat_bledu
  );

  return pobierzOgraniczenie(result.lastInsertRowid as number)!;
}

export function dodajWieleOgraniczen(zadanieId: number, ograniczenia: OgraniczenieInput[]): OgraniczenieZadania[] {
  const db = getDb();
  const wyniki: OgraniczenieZadania[] = [];

  const insert = db.prepare(`
    INSERT INTO ograniczenia_zadania (
      zadanie_id, nazwa, opis, typ,
      warunek_pole, warunek_operator, warunek_wartosc,
      ograniczenie_pole, ograniczenie_operator, ograniczenie_wartosc,
      komunikat_bledu
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const ogr of ograniczenia) {
    const result = insert.run(
      zadanieId,
      ogr.nazwa,
      ogr.opis ?? null,
      ogr.typ,
      ogr.warunek_pole ?? null,
      ogr.warunek_operator ?? null,
      ogr.warunek_wartosc ?? null,
      ogr.ograniczenie_pole ?? null,
      ogr.ograniczenie_operator ?? null,
      ogr.ograniczenie_wartosc ?? null,
      ogr.komunikat_bledu
    );
    wyniki.push(pobierzOgraniczenie(result.lastInsertRowid as number)!);
  }

  return wyniki;
}

export function dezaktywujOgraniczenie(id: number): boolean {
  const db = getDb();
  const result = db.prepare(
    'UPDATE ograniczenia_zadania SET aktywne = 0 WHERE id = ?'
  ).run(id);
  return result.changes > 0;
}

export function dezaktywujWszystkieOgraniczenia(zadanieId: number): number {
  const db = getDb();
  const result = db.prepare(
    'UPDATE ograniczenia_zadania SET aktywne = 0 WHERE zadanie_id = ?'
  ).run(zadanieId);
  return result.changes;
}

export function usunOgraniczenie(id: number): boolean {
  const db = getDb();
  const result = db.prepare(
    'DELETE FROM ograniczenia_zadania WHERE id = ?'
  ).run(id);
  return result.changes > 0;
}
