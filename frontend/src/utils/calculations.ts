import { expenditureGroupMappings } from '../data/dictionaries';
import { DaneFinansoweRoku } from '../types/budget';

/**
 * Wyznacza grupę wydatków na podstawie paragrafu
 * Logika: sprawdza zakresy i zwraca odpowiednią grupę
 */
export function getExpenditureGroup(paragraph: string): string {
    const paragraphNum = parseInt(paragraph, 10);

    if (isNaN(paragraphNum)) {
        return '';
    }

    const mapping = expenditureGroupMappings.find(
        m => paragraphNum >= m.poczatekZakresu && paragraphNum <= m.koniecZakresu
    );

    return mapping?.grupa || 'Nieznana grupa';
}

/**
 * Oblicza brakującą kwotę (gap)
 */
export function calculateGap(needs: number | null, limit: number | null): number {
    const needsVal = needs ?? 0;
    const limitVal = limit ?? 0;
    return needsVal - limitVal;
}

/**
 * Wycina pierwsze 5 znaków z pełnego budżetu zadaniowego (XX.XX)
 */
export function extractTaskBudgetShort(full: string): string {
    if (!full) return '';
    const parts = full.split('.');
    if (parts.length >= 2) {
        return `${parts[0]}.${parts[1]}`;
    }
    return full;
}

/**
 * Sprawdza czy paragraf wskazuje na dotację (grupy 2xx lub 6xx)
 */
export function isDotationParagraph(paragraph: string): boolean {
    const paragraphNum = parseInt(paragraph, 10);
    if (isNaN(paragraphNum)) return false;

    return (paragraphNum >= 200 && paragraphNum <= 299) ||
        (paragraphNum >= 600 && paragraphNum <= 699);
}

/**
 * Formatuje liczbę jako walutę PLN
 */
export function formatCurrency(value: number | null): string {
    if (value === null) return '';
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
        minimumFractionDigits: 2,
    }).format(value);
}

/**
 * Parsuje string walutowy do liczby
 */
export function parseCurrency(value: string): number | null {
    if (!value || value.trim() === '') return null;

    // Usuń spacje, znaki waluty i zamień przecinek na kropkę
    const cleaned = value
        .replace(/\s/g, '')
        .replace(/zł/gi, '')
        .replace(/PLN/gi, '')
        .replace(/,/g, '.')
        .trim();

    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
}

/**
 * Aktualizuje dane finansowe roku z przeliczeniem gap
 */
export function updateFinancialYearData(
    data: DaneFinansoweRoku,
    field: keyof DaneFinansoweRoku,
    value: number | null | string
): DaneFinansoweRoku {
    const updated = { ...data, [field]: value };

    // Przelicz gap gdy zmienia się needs lub limit
    if (field === 'potrzeby' || field === 'limit') {
        updated.roznica = calculateGap(updated.potrzeby, updated.limit);
    }

    return updated;
}

/**
 * Generuje unikalny identyfikator
 */
export function generateId(): string {
    return crypto.randomUUID();
}

/**
 * Waliduje format budżetu zadaniowego (XX.XX.XX.XX)
 */
export function isValidTaskBudgetFormat(value: string): boolean {
    // Akceptuj format: cyfry.cyfry.cyfry.cyfry (np. 18.1.1.1 lub 01.02.03.04)
    const pattern = /^\d+\.\d+\.\d+\.\d+$/;
    return pattern.test(value);
}
