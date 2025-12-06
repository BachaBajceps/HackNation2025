// Typy pomocnicze
export type YearKey = '2026' | '2027' | '2028' | '2029';

export interface FinancialYearData {
    year: number;
    needs: number | null;           // Potrzeby finansowe
    limit: number | null;           // Limit wydatków
    gap: number;                    // Braki (obliczane: needs - limit)
    contractedAmount: number | null;// Kwota zaangażowana
    contractNumber: string;         // Nr umowy/wniosku
}

export interface BudgetRow {
    id: string;

    // Klasyfikacja budżetowa
    part: string;                   // Część budżetowa (kol. 1)
    section: string;                // Dział (kol. 2)
    chapter: string;                // Rozdział (kol. 3)
    paragraph: string;              // Paragraf (kol. 4)
    financingSource: string;        // Źródło finansowania (kol. 5)
    expenditureGroup: string;       // Grupa wydatków (kol. 6 - auto)

    // Budżet Zadaniowy
    taskBudgetFull: string;         // Pełna szczegółowość (kol. 7)
    taskBudgetFunction: string;     // Funkcja i zadanie (kol. 8 - auto)

    // Dane organizacyjne i opisowe
    projectName: string;            // Nazwa programu/projektu (kol. 9)
    orgUnit: string;                // Komórka organizacyjna (kol. 10)
    planWI: string;                 // Plan WI (kol. 11)
    disposer: string;               // Dysponent (kol. 12)
    budgetCode: string;             // Budżet (kol. 13)
    taskName: string;               // Nazwa zadania (kol. 14)
    justification: string;          // Uzasadnienie (kol. 15)
    category: string;               // Obszar działalności (kol. 16)

    // Dane finansowe (na 4 lata)
    financials: Record<YearKey, FinancialYearData>;

    // Dodatkowe informacje
    grantRecipient: string;         // Dotacje - beneficjent (kol. 37)
    grantLegalBasis: string;        // Podstawa prawna dotacji (kol. 38)
    comments: string;               // Uwagi (kol. 39)
}

// Typy dla słowników
export interface DictionaryItem {
    code: string;
    name: string;
}

export interface ChapterItem extends DictionaryItem {
    parentSection: string;
}

export interface TaskBudgetItem {
    code: string;
    name: string;
    level: number; // 1=Funkcja, 2=Zadanie, 3=Podzadanie, 4=Działanie
    parent?: string;
}

export interface ExpenditureGroupMapping {
    paragraphRangeStart: number;
    paragraphRangeEnd: number;
    group: string;
}

// Początkowy stan dla danych finansowych roku
export const createEmptyFinancialYear = (year: number): FinancialYearData => ({
    year,
    needs: null,
    limit: null,
    gap: 0,
    contractedAmount: null,
    contractNumber: ''
});

// Początkowy stan formularza
export const createEmptyBudgetRow = (): BudgetRow => ({
    id: crypto.randomUUID(),
    part: '',
    section: '',
    chapter: '',
    paragraph: '',
    financingSource: '',
    expenditureGroup: '',
    taskBudgetFull: '',
    taskBudgetFunction: '',
    projectName: '',
    orgUnit: '',
    planWI: '',
    disposer: '',
    budgetCode: '',
    taskName: '',
    justification: '',
    category: '',
    financials: {
        '2026': createEmptyFinancialYear(2026),
        '2027': createEmptyFinancialYear(2027),
        '2028': createEmptyFinancialYear(2028),
        '2029': createEmptyFinancialYear(2029),
    },
    grantRecipient: '',
    grantLegalBasis: '',
    comments: ''
});

// Typ dla walidacji
export interface ValidationError {
    field: string;
    message: string;
    type: 'error' | 'warning';
}
