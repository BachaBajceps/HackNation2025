// Types matching frontend BudgetRow structure
// These will be used for API input/output

export type YearKey = '2026' | '2027' | '2028' | '2029';

export interface FinancialYearData {
    year: number;
    needs: number | null;           // potrzeby_finansowe
    limit: number | null;           // limit_wydatkow
    gap: number;                    // kwota_niezabezpieczona (computed)
    contractedAmount: number | null;// kwota_umowy
    contractNumber: string;         // nr_umowy
}

export interface BudgetRowInput {
    id?: string;

    // Klasyfikacja budżetowa
    part: string;                   // czesc_budzetowa.kod
    section: string;                // dzial.kod
    chapter: string;                // rozdzial.kod
    paragraph: string;              // paragraf.kod
    financingSource: string;        // zrodlo_finansowania.kod
    expenditureGroup: string;       // grupa_wydatkow.nazwa

    // Budżet Zadaniowy
    taskBudgetFull: string;         // budzet_zadaniowy_szczegolowy.kod
    taskBudgetFunction: string;     // budzet_zadaniowy_skrocony.kod (auto from full)

    // Dane organizacyjne i opisowe
    projectName: string;            // pozycja_budzetu.nazwa_programu_projektu
    orgUnit: string;                // pozycja_budzetu.nazwa_komorki_organizacyjnej
    planWI: string;                 // pozycja_budzetu.plan_wi
    disposer: string;               // pozycja_budzetu.dysponent_srodkow
    budgetCode: string;             // pozycja_budzetu.budzet
    taskName: string;               // opis_zadania.nazwa_zadania
    justification: string;          // opis_zadania.uzasadnienie
    category: string;               // opis_zadania.przeznaczenie_wydatkow

    // Dane finansowe (na 4 lata)
    financials: Record<YearKey, FinancialYearData>;

    // Dodatkowe informacje
    grantRecipient: string;         // opis_zadania.dotacja_partner
    grantLegalBasis: string;        // opis_zadania.dotacja_podstawa_prawna
    comments: string;               // opis_zadania.uwagi
}

export interface BudgetRowResponse extends BudgetRowInput {
    id: string;
    createdAt?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
