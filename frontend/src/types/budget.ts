// Typy pomocnicze
export type KluczRoku = '2026' | '2027' | '2028' | '2029';

export interface DaneFinansoweRoku {
    rok: number;
    potrzeby: number | null;        // Potrzeby finansowe (needs)
    limit: number | null;           // Limit wydatków (limit)
    roznica: number;                // Różnica/Braki (gap)
    zaangazowanie: number | null;   // Kwota zaangażowana (contractedAmount)
    nrUmowy: string;                // Nr umowy/wniosku (contractNumber)
}

export interface WierszBudzetowy {
    id: string;

    // Klasyfikacja budżetowa
    czesc: string;                  // Część (part)
    dzial: string;                  // Dział (section)
    rozdzial: string;               // Rozdział (chapter)
    paragraf: string;               // Paragraf (paragraph)
    zrodloFinansowania: string;     // Źródło finansowania (financingSource)
    grupaWydatkow: string;          // Grupa wydatków (expenditureGroup)

    // Budżet Zadaniowy
    budzetZadaniowyPelny: string;   // Pełna szczegółowość (taskBudgetFull)
    funkcjaZadanie: string;         // Funkcja i zadanie (taskBudgetFunction)

    // Dane organizacyjne i opisowe
    nazwaProjektu: string;          // Nazwa programu/projektu (projectName)
    komorkaOrganizacyjna: string;   // Komórka organizacyjna (orgUnit)
    planWI: string;                 // Plan WI
    dysponent: string;              // Dysponent (disposer)
    kodBudzetu: string;             // Kod budżetu (budgetCode)
    nazwaZadania: string;           // Nazwa zadania (taskName)
    uzasadnienie: string;           // Uzasadnienie (justification)
    przeznaczenie: string;          // Przeznaczenie wydatków (category)

    // Dane finansowe (na 4 lata)
    daneFinansowe: Record<KluczRoku, DaneFinansoweRoku>;

    // Dodatkowe informacje
    beneficjentDotacji: string;     // Dotacje - beneficjent (grantRecipient)
    podstawaPrawnaDotacji: string;  // Podstawa prawna dotacji (grantLegalBasis)
    uwagi: string;                  // Uwagi (comments)
}

// Typy dla słowników
export interface ElementSlownika {
    code: string;
    name: string;
}

export interface ElementRozdzialu extends ElementSlownika {
    parentSection: string;
}

export interface ElementBudzetuZadaniowego {
    code: string;
    name: string;
    level: number;
    parent?: string;
}

export interface MapowanieGrupyWydatkow {
    poczatekZakresu: number;
    koniecZakresu: number;
    grupa: string;
}

// Początkowy stan dla danych finansowych roku
export const utworzPusteDaneRoku = (rok: number): DaneFinansoweRoku => ({
    rok,
    potrzeby: null,
    limit: null,
    roznica: 0,
    zaangazowanie: null,
    nrUmowy: ''
});

// Początkowy stan formularza
export const utworzPustyWiersz = (): WierszBudzetowy => ({
    id: crypto.randomUUID(),
    czesc: '',
    dzial: '',
    rozdzial: '',
    paragraf: '',
    zrodloFinansowania: '',
    grupaWydatkow: '',
    budzetZadaniowyPelny: '',
    funkcjaZadanie: '',
    nazwaProjektu: '',
    komorkaOrganizacyjna: '',
    planWI: '',
    dysponent: '',
    kodBudzetu: '',
    nazwaZadania: '',
    uzasadnienie: '',
    przeznaczenie: '',
    daneFinansowe: {
        '2026': utworzPusteDaneRoku(2026),
        '2027': utworzPusteDaneRoku(2027),
        '2028': utworzPusteDaneRoku(2028),
        '2029': utworzPusteDaneRoku(2029),
    },
    beneficjentDotacji: '',
    podstawaPrawnaDotacji: '',
    uwagi: ''
});

// Typ dla walidacji
export interface ValidationError {
    field: string;
    message: string;
    type: 'error' | 'warning';
}

export type StatusFormularza = 'draft' | 'submitted' | 'historical' | 'archived';

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
