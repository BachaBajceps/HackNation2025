import { getDb } from '../db';
import type { Departament } from '../types';

export function pobierzWszystkieDepartamenty(): Departament[] {
  const db = getDb();
  return db.prepare('SELECT * FROM departamenty ORDER BY nazwa').all() as Departament[];
}

export function pobierzDepartament(id: number): Departament | null {
  const db = getDb();
  return db.prepare('SELECT * FROM departamenty WHERE id = ?').get(id) as Departament | null;
}

export function pobierzDepartamentPoKodzie(kod: string): Departament | null {
  const db = getDb();
  return db.prepare('SELECT * FROM departamenty WHERE kod = ?').get(kod) as Departament | null;
}
