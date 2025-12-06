import type { WynikWalidacji, Formularz, OgraniczenieZadania } from '../types';
import { getDb } from '../db';
import { pobierzOgraniczeniaZadania } from '../services/ograniczenieService';

// Pobierz limit departamentu
function pobierzLimitDepartamentu(zadanieId: number, departamentId: number): number {
  const db = getDb();
  const result = db.prepare(
    'SELECT limit_budzetu FROM limity_departamentow WHERE zadanie_id = ? AND departament_id = ?'
  ).get(zadanieId, departamentId) as { limit_budzetu: number } | undefined;
  return result?.limit_budzetu ?? 0;
}

// Pobierz wartosc pola z formularza
function pobierzWartoscPola(formularz: Formularz, pole: string): unknown {
  return (formularz as unknown as Record<string, unknown>)[pole];
}

// Sprawdz pojedyncze ograniczenie dla formularza
function sprawdzOgraniczenie(
  ograniczenie: OgraniczenieZadania,
  formularz: Formularz
): { spelnione: boolean; komunikat?: string } {

  // Sprawdz warunek (jesli jest)
  if (ograniczenie.warunek_pole && ograniczenie.warunek_operator) {
    const wartoscPola = pobierzWartoscPola(formularz, ograniczenie.warunek_pole);
    const warunekWartosc = ograniczenie.warunek_wartosc;

    const warunekSpelniony = sprawdzWarunek(
      wartoscPola,
      ograniczenie.warunek_operator,
      warunekWartosc
    );

    if (!warunekSpelniony) {
      return { spelnione: true }; // Warunek nie spelniony = ograniczenie nie dotyczy
    }
  }

  // Sprawdz ograniczenie
  if (ograniczenie.ograniczenie_pole && ograniczenie.ograniczenie_operator) {
    const wartoscPola = pobierzWartoscPola(formularz, ograniczenie.ograniczenie_pole);

    const ograniczenieSpelnione = sprawdzWarunek(
      wartoscPola,
      ograniczenie.ograniczenie_operator,
      ograniczenie.ograniczenie_wartosc
    );

    if (!ograniczenieSpelnione) {
      return { spelnione: false, komunikat: ograniczenie.komunikat_bledu };
    }
  }

  return { spelnione: true };
}

// Sprawdz warunek/ograniczenie
function sprawdzWarunek(
  wartosc: unknown,
  operator: string,
  oczekiwana: string | null
): boolean {
  const numWartosc = typeof wartosc === 'number' ? wartosc : parseFloat(String(wartosc));
  const numOczekiwana = oczekiwana ? parseFloat(oczekiwana) : 0;

  switch (operator) {
    case '=':
      return String(wartosc) === oczekiwana;
    case '!=':
      return String(wartosc) !== oczekiwana;
    case '>':
      return numWartosc > numOczekiwana;
    case '<':
      return numWartosc < numOczekiwana;
    case '>=':
      return numWartosc >= numOczekiwana;
    case '<=':
      return numWartosc <= numOczekiwana;
    case 'IN':
      if (!oczekiwana) return false;
      const lista = oczekiwana.split(',').map(s => s.trim());
      return lista.includes(String(wartosc));
    case 'NOT_IN':
      if (!oczekiwana) return true;
      const listaWykl = oczekiwana.split(',').map(s => s.trim());
      return !listaWykl.includes(String(wartosc));
    case 'IS_NULL':
      return wartosc === null || wartosc === undefined || wartosc === '';
    case 'IS_NOT_NULL':
    case 'NOT_NULL':
      return wartosc !== null && wartosc !== undefined && wartosc !== '';
    default:
      return true;
  }
}

// Waliduj pojedynczy formularz wobec ograniczen zadania
export function walidujFormularzWobecOgraniczen(
  formularz: Formularz,
  ograniczenia: OgraniczenieZadania[]
): WynikWalidacji {
  const bledy: string[] = [];
  const ostrzezenia: string[] = [];

  for (const ogr of ograniczenia) {
    if (ogr.typ === 'pole_wartosc' || ogr.typ === 'wymagane_pole' || ogr.typ === 'zakres_wartosci') {
      const wynik = sprawdzOgraniczenie(ogr, formularz);
      if (!wynik.spelnione && wynik.komunikat) {
        bledy.push(`[${ogr.nazwa}] ${wynik.komunikat}`);
      }
    }
  }

  return { valid: bledy.length === 0, bledy, ostrzezenia };
}

// Waliduj sume pola dla wszystkich formularzy departamentu
export function walidujSumyPol(
  formularze: Formularz[],
  ograniczenia: OgraniczenieZadania[]
): WynikWalidacji {
  const bledy: string[] = [];
  const ostrzezenia: string[] = [];

  for (const ogr of ograniczenia) {
    if (ogr.typ === 'suma_pola' && ogr.ograniczenie_pole) {
      const suma = formularze.reduce((acc, f) => {
        const val = pobierzWartoscPola(f, ogr.ograniczenie_pole!);
        return acc + (typeof val === 'number' ? val : 0);
      }, 0);

      const limitWartosc = parseFloat(ogr.ograniczenie_wartosc ?? '0');

      if (ogr.ograniczenie_operator === '<=' && suma > limitWartosc) {
        bledy.push(`[${ogr.nazwa}] ${ogr.komunikat_bledu} (suma: ${suma}, limit: ${limitWartosc})`);
      }
      if (ogr.ograniczenie_operator === '<' && suma >= limitWartosc) {
        bledy.push(`[${ogr.nazwa}] ${ogr.komunikat_bledu} (suma: ${suma}, limit: ${limitWartosc})`);
      }
    }
  }

  return { valid: bledy.length === 0, bledy, ostrzezenia };
}

// Glowna walidacja wysylki zbiorczej departamentu
export function walidujWysylkeZbiorcza(
  zadanieId: number,
  departamentId: number,
  formularze: Formularz[]
): WynikWalidacji {
  const bledy: string[] = [];
  const ostrzezenia: string[] = [];

  if (formularze.length === 0) {
    bledy.push('Brak formularzy do wyslania');
    return { valid: false, bledy, ostrzezenia };
  }

  // Pobierz ograniczenia zadania
  const ograniczenia = pobierzOgraniczeniaZadania(zadanieId);

  // 1. Waliduj kazdy formularz wobec ograniczen
  for (const formularz of formularze) {
    const wynikFormularza = walidujFormularzWobecOgraniczen(formularz, ograniczenia);
    bledy.push(...wynikFormularza.bledy);
    ostrzezenia.push(...wynikFormularza.ostrzezenia);
  }

  // 2. Waliduj sumy pol
  const wynikSum = walidujSumyPol(formularze, ograniczenia);
  bledy.push(...wynikSum.bledy);
  ostrzezenia.push(...wynikSum.ostrzezenia);

  // 3. Waliduj limit budzetu departamentu
  const limit = pobierzLimitDepartamentu(zadanieId, departamentId);
  const sumaRok1 = formularze.reduce((acc, f) => acc + (f.rok_1 ?? 0), 0);

  if (limit > 0 && sumaRok1 > limit) {
    bledy.push(`Suma budzetu (${sumaRok1}) przekracza limit departamentu (${limit})`);
  }

  if (limit > 0 && sumaRok1 > limit * 0.9 && sumaRok1 <= limit) {
    ostrzezenia.push(`Wykorzystano ponad 90% limitu budzetu departamentu`);
  }

  return { valid: bledy.length === 0, bledy, ostrzezenia };
}

// Walidacja calego zadania (dla raportu)
export function walidujCalosZadania(zadanieId: number): WynikWalidacji {
  const bledy: string[] = [];
  const ostrzezenia: string[] = [];

  const db = getDb();

  // Sprawdz czy wszystkie departamenty z limitami wyslaly
  const niezrealizowane = db.prepare(`
    SELECT d.nazwa
    FROM limity_departamentow l
    JOIN departamenty d ON d.id = l.departament_id
    LEFT JOIN wysylki_departamentow w ON w.zadanie_id = l.zadanie_id
      AND w.departament_id = l.departament_id AND w.status = 'wyslano'
    WHERE l.zadanie_id = ? AND l.limit_budzetu > 0 AND w.id IS NULL
  `).all(zadanieId) as { nazwa: string }[];

  for (const dep of niezrealizowane) {
    ostrzezenia.push(`Departament "${dep.nazwa}" nie wyslal formularzy`);
  }

  return { valid: bledy.length === 0, bledy, ostrzezenia };
}

// Walidacja raportu zbiorczego
export function walidujRaportZbiorczy(zadanieId: number): WynikWalidacji {
  return walidujCalosZadania(zadanieId);
}
