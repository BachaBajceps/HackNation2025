// Typy pasujące do struktury frontendu (polskie nazwy)
// Używane do komunikacji API

export type KluczRoku = '2026' | '2027' | '2028' | '2029';

export interface DaneFinansoweRoku {
    rok: number;
    potrzeby: number | null;        // potrzeby_finansowe
    limit: number | null;           // limit_wydatkow
    roznica: number;                // kwota_niezabezpieczona (obliczane)
    zaangazowanie: number | null;   // kwota_umowy
    nrUmowy: string;                // nr_umowy
}

export interface WierszBudzetowyInput {
    id?: string;

    // Klasyfikacja budżetowa
    czesc: string;                  // czesc_budzetowa.kod
    dzial: string;                  // dzial.kod
    rozdzial: string;               // rozdzial.kod
    paragraf: string;               // paragraf.kod
    zrodloFinansowania: string;     // zrodlo_finansowania.kod
    grupaWydatkow: string;          // grupa_wydatkow.nazwa

    // Budżet Zadaniowy
    budzetZadaniowyPelny: string;   // budzet_zadaniowy_szczegolowy.kod
    funkcjaZadanie: string;         // budzet_zadaniowy_skrocony.kod

    // Dane organizacyjne i opisowe
    nazwaProjektu: string;          // pozycja_budzetu.nazwa_programu_projektu
    komorkaOrganizacyjna: string;   // pozycja_budzetu.nazwa_komorki_organizacyjnej
    planWI: string;                 // pozycja_budzetu.plan_wi
    dysponent: string;              // pozycja_budzetu.dysponent_srodkow
    kodBudzetu: string;             // pozycja_budzetu.budzet
    nazwaZadania: string;           // opis_zadania.nazwa_zadania
    uzasadnienie: string;           // opis_zadania.uzasadnienie
    przeznaczenie: string;          // opis_zadania.przeznaczenie_wydatkow

    // Dane finansowe (na 4 lata)
    daneFinansowe: Record<KluczRoku, DaneFinansoweRoku>;

    // Dodatkowe informacje
    beneficjentDotacji: string;     // opis_zadania.dotacja_partner
    podstawaPrawnaDotacji: string;  // opis_zadania.dotacja_podstawa_prawna
    uwagi: string;                  // opis_zadania.uwagi
}

export interface WierszBudzetowyResponse extends WierszBudzetowyInput {
    id: string;
    dataUtworzenia?: string;
}

export interface OdpowiedzAPI<T> {
    sukces: boolean;
    dane?: T;
    blad?: string;
}
