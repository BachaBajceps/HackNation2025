// === STATUSY ===

export type StatusFormularza = 'draft' | 'submitted' | 'historical' | 'archived';
export type StatusZadania = 'active' | 'closed';
export type StatusWysylki = 'oczekuje' | 'wyslano' | 'wymaga_korekty';
export type TypOgraniczenia = 'pole_wartosc' | 'suma_pola' | 'wymagane_pole' | 'zakres_wartosci' | 'custom';
export type OperatorWarunku = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'IN' | 'NOT_IN' | 'IS_NULL' | 'IS_NOT_NULL';
export type OperatorOgraniczenia = '<=' | '>=' | '<' | '>' | '=' | 'IN' | 'NOT_NULL';

// === DEPARTAMENT ===

export interface Departament {
  id: number;
  nazwa: string;
  kod: string;
}

// === OGRANICZENIA ZADANIA ===

export interface OgraniczenieZadania {
  id: number;
  zadanie_id: number;
  nazwa: string;
  opis: string | null;
  typ: TypOgraniczenia;

  warunek_pole: string | null;
  warunek_operator: OperatorWarunku | null;
  warunek_wartosc: string | null;

  ograniczenie_pole: string | null;
  ograniczenie_operator: OperatorOgraniczenia | null;
  ograniczenie_wartosc: string | null;

  komunikat_bledu: string;
  aktywne: number;
  created_at: string;
}

export interface OgraniczenieInput {
  nazwa: string;
  opis?: string;
  typ: TypOgraniczenia;
  warunek_pole?: string;
  warunek_operator?: OperatorWarunku;
  warunek_wartosc?: string;
  ograniczenie_pole?: string;
  ograniczenie_operator?: OperatorOgraniczenia;
  ograniczenie_wartosc?: string;
  komunikat_bledu: string;
}

// === LIMIT DEPARTAMENTU ===

export interface LimitDepartamentu {
  id: number;
  zadanie_id: number;
  departament_id: number;
  limit_budzetu: number;
}

// === ZADANIE ===

export interface Zadanie {
  id: number;
  tytul: string;
  opis: string | null;
  termin_do: string;
  created_at: string;
  updated_at: string;
  wersja: number;
  status: StatusZadania;
}

export interface ZadanieZLimitami extends Zadanie {
  limity: LimitDepartamentu[];
  ograniczenia: OgraniczenieZadania[];
}

export interface NoweZadanieInput {
  tytul: string;
  opis?: string;
  termin_do: string;
  limity: { departament_id: number; limit_budzetu: number }[];
  ograniczenia?: OgraniczenieInput[];
}

export interface AktualizacjaZadaniaInput {
  tytul?: string;
  opis?: string;
  termin_do?: string;
  limity?: { departament_id: number; limit_budzetu: number }[];
  ograniczenia?: OgraniczenieInput[];
}

// === WYSYLKA DEPARTAMENTU ===

export interface WysylkaDepartamentu {
  id: number;
  zadanie_id: number;
  departament_id: number;
  zadanie_wersja: number;
  status: StatusWysylki;
  liczba_formularzy: number;
  suma_rok_1: number;
  suma_rok_2: number;
  suma_rok_3: number;
  suma_rok_4: number;
  wyslano_at: string | null;
  created_at: string;
}

export interface WysylkaZDepartamentem extends WysylkaDepartamentu {
  departament: Departament;
}

// === FORMULARZ ===

export interface PolaFormularzaFiltrowane {
  kod_rozdzialu: string | null;
  kod_paragrafu: string | null;
  kod_dzialania: string | null;
  nazwa_zadania: string | null;
  kategoria: string | null;
  priorytet: string | null;
  rok_1: number | null;
  rok_2: number | null;
  rok_3: number | null;
  rok_4: number | null;
  typ_wydatku: string | null;
  zrodlo_finansowania: string | null;
  jednostka_realizujaca: string | null;
}

export interface PolaFormularzaDodatkowe {
  opis_szczegolowy: string | null;
  uzasadnienie: string | null;
  uwagi: string | null;
  zalaczniki_ref: string | null;
  osoba_odpowiedzialna: string | null;
  telefon_kontaktowy: string | null;
  email_kontaktowy: string | null;
  data_rozpoczecia: string | null;
  data_zakonczenia: string | null;
  wskazniki_realizacji: string | null;
}

export interface Formularz extends PolaFormularzaFiltrowane, PolaFormularzaDodatkowe {
  id: number;
  zadanie_id: number;
  departament_id: number;
  wysylka_id: number | null;
  status: StatusFormularza;
  parent_formularz_id: number | null;
  zadanie_wersja: number;
  created_at: string;
  submitted_at: string | null;
  version: number;
}

export interface FormularzInput extends Partial<PolaFormularzaFiltrowane>, Partial<PolaFormularzaDodatkowe> {
  zadanie_id: number;
  departament_id: number;
}

// === FILTRY ===

export interface FiltryFormularzy {
  zadanie_id?: number;
  departament_id?: number;
  status?: StatusFormularza;
  wysylka_id?: number;
  zadanie_wersja?: number;
  kod_rozdzialu?: string;
  kod_paragrafu?: string;
  kod_dzialania?: string;
  kategoria?: string;
  priorytet?: string;
  typ_wydatku?: string;
  zrodlo_finansowania?: string;
  rok?: number;
  kwota_min?: number;
  kwota_max?: number;
}

// === WALIDACJA ===

export interface WynikWalidacji {
  valid: boolean;
  bledy: string[];
  ostrzezenia: string[];
}

export interface WynikWalidacjiOgraniczenia extends WynikWalidacji {
  ograniczenie_id?: number;
  ograniczenie_nazwa?: string;
}

// === MONITORING ===

export interface StatusDepartamentuWZadaniu {
  departament: Departament;
  limit_budzetu: number;
  wysylka: WysylkaDepartamentu | null;
  liczba_draftow: number;
  suma_draftow_rok_1: number;
  czy_wyslano: boolean;
  czy_wymaga_korekty: boolean;
}

export interface MonitoringZadania {
  zadanie: Zadanie;
  departamenty: StatusDepartamentuWZadaniu[];
  statystyki: {
    wszystkich_departamentow: number;
    wyslanych: number;
    oczekujacych: number;
    wymagajacych_korekty: number;
    procent_ukonczenia: number;
  };
}

// === RAPORT ===

export interface RaportZbiorczy {
  zadanie: Zadanie;
  formularze: Formularz[];
  podsumowanie: {
    liczba_formularzy: number;
    suma_rok_1: number;
    suma_rok_2: number;
    suma_rok_3: number;
    suma_rok_4: number;
    per_departament: {
      departament_id: number;
      departament_nazwa: string;
      liczba_formularzy: number;
      suma: number;
      limit: number;
      wykorzystanie_procent: number;
    }[];
  };
}

// === HISTORIA ===

export interface ZadanieHistoria {
  id: number;
  zadanie_id: number;
  wersja: number;
  zmiana_typ: string;
  zmiana_opis: string | null;
  stare_dane: string | null;
  nowe_dane: string | null;
  created_at: string;
}

// === API RESPONSE ===

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  bledy?: string[];
  ostrzezenia?: string[];
}
