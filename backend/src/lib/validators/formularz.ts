import type { Formularz, FormularzInput, WynikWalidacji } from '../types';

// TODO: Dodac walidacje pol wymaganych
export function walidujFormularzInput(input: FormularzInput): WynikWalidacji {
  const bledy: string[] = [];
  const ostrzezenia: string[] = [];

  if (!input.zadanie_id) {
    bledy.push('Brak zadanie_id');
  }
  if (!input.departament_id) {
    bledy.push('Brak departament_id');
  }

  // TODO: Walidacja klasyfikacji budzetowej (kod_rozdzialu, kod_paragrafu, kod_dzialania)
  // TODO: Walidacja czy kody sa zgodne z rozporzadzeniem

  return {
    valid: bledy.length === 0,
    bledy,
    ostrzezenia
  };
}

// TODO: Walidacja przed wyslaniem
export function walidujPrzedWyslaniem(formularz: Formularz): WynikWalidacji {
  const bledy: string[] = [];
  const ostrzezenia: string[] = [];

  // TODO: Sprawdz wymagane pola
  // TODO: Sprawdz poprawnosc kwot (nie ujemne)
  // TODO: Sprawdz klasyfikacje budzetowa

  if (formularz.rok_1 !== null && formularz.rok_1 < 0) {
    bledy.push('Kwota rok_1 nie moze byc ujemna');
  }
  if (formularz.rok_2 !== null && formularz.rok_2 < 0) {
    bledy.push('Kwota rok_2 nie moze byc ujemna');
  }
  if (formularz.rok_3 !== null && formularz.rok_3 < 0) {
    bledy.push('Kwota rok_3 nie moze byc ujemna');
  }
  if (formularz.rok_4 !== null && formularz.rok_4 < 0) {
    bledy.push('Kwota rok_4 nie moze byc ujemna');
  }

  return {
    valid: bledy.length === 0,
    bledy,
    ostrzezenia
  };
}
