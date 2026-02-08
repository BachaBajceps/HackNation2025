import { getDb } from '../db';
import type { Departament } from '../types';

export function pobierzWszystkieDepartamenty(): Departament[] {
  const db = getDb();
  return db.prepare('SELECT * FROM departamenty ORDER BY nazwa').all() as Departament[];
}
