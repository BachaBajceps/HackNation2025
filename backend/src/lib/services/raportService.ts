import { getDb } from '../db';
import type { RaportZbiorczy, Formularz, Zadanie, Departament } from '../types';
import { pobierzZadanie } from './zadanieService';
import { pobierzFormularze, obliczSumeDepartamentu } from './formularzService';

export function generujRaportZbiorczy(zadanieId: number): RaportZbiorczy | null {
  const db = getDb();

  const zadanie = pobierzZadanie(zadanieId);
  if (!zadanie) return null;

  const formularze = pobierzFormularze({ zadanie_id: zadanieId, status: 'submitted' });

  // Pobierz wszystkie departamenty ktore wyslaly formularze
  const departamentyIds = [...new Set(formularze.map(f => f.departament_id))];

  const departamenty = db.prepare(
    `SELECT * FROM departamenty WHERE id IN (${departamentyIds.map(() => '?').join(',')})`
  ).all(...departamentyIds) as Departament[];

  const departamentyMap = new Map(departamenty.map(d => [d.id, d]));

  // Pobierz limity
  const limity = db.prepare(
    'SELECT * FROM limity_departamentow WHERE zadanie_id = ?'
  ).all(zadanieId) as { departament_id: number; limit_budzetu: number }[];

  const limityMap = new Map(limity.map(l => [l.departament_id, l.limit_budzetu]));

  // Oblicz sumy per departament
  const perDepartament = departamentyIds.map(depId => {
    const sumy = obliczSumeDepartamentu(zadanieId, depId);
    const limit = limityMap.get(depId) ?? 0;
    const suma = sumy.suma_rok_1; // TODO: Ustalic ktory rok liczymy do limitu

    return {
      departament_id: depId,
      departament_nazwa: departamentyMap.get(depId)?.nazwa ?? 'Nieznany',
      liczba_formularzy: formularze.filter(f => f.departament_id === depId).length,
      suma,
      limit,
      wykorzystanie_procent: limit > 0 ? Math.round((suma / limit) * 100) : 0
    };
  });

  // Oblicz sumy globalne
  const sumaRok1 = formularze.reduce((acc, f) => acc + (f.rok_1 ?? 0), 0);
  const sumaRok2 = formularze.reduce((acc, f) => acc + (f.rok_2 ?? 0), 0);
  const sumaRok3 = formularze.reduce((acc, f) => acc + (f.rok_3 ?? 0), 0);
  const sumaRok4 = formularze.reduce((acc, f) => acc + (f.rok_4 ?? 0), 0);

  return {
    zadanie,
    formularze,
    podsumowanie: {
      liczba_formularzy: formularze.length,
      suma_rok_1: sumaRok1,
      suma_rok_2: sumaRok2,
      suma_rok_3: sumaRok3,
      suma_rok_4: sumaRok4,
      per_departament: perDepartament
    }
  };
}

// TODO: Export do Excel
export function eksportujDoExcel(zadanieId: number): Buffer {
  // TODO: Uzyc biblioteki jak xlsx lub exceljs
  throw new Error('Nie zaimplementowano - TODO');
}

// TODO: Agregacje i statystyki
export function pobierzStatystyki(zadanieId: number): {
  liczba_departamentow: number;
  liczba_formularzy_draft: number;
  liczba_formularzy_submitted: number;
  procent_ukonczenia: number;
} {
  const db = getDb();

  const stats = db.prepare(`
    SELECT
      COUNT(DISTINCT departament_id) as liczba_departamentow,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
      SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted
    FROM formularze
    WHERE zadanie_id = ?
  `).get(zadanieId) as { liczba_departamentow: number; draft: number; submitted: number };

  const total = stats.draft + stats.submitted;

  return {
    liczba_departamentow: stats.liczba_departamentow,
    liczba_formularzy_draft: stats.draft,
    liczba_formularzy_submitted: stats.submitted,
    procent_ukonczenia: total > 0 ? Math.round((stats.submitted / total) * 100) : 0
  };
}
