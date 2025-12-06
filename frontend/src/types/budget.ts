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
