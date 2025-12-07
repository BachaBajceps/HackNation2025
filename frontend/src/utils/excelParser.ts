import * as XLSX from 'xlsx';

export interface ParsedFormularz {
    kod_rozdzialu: string | null;
    kod_paragrafu: string | null;
    zrodlo_finansowania: string | null;
    typ_wydatku: string | null;
    nazwa_zadania: string | null;
    jednostka_realizujaca: string | null;
    rok_1: number | null;
    rok_2: number | null;
    rok_3: number | null;
    rok_4: number | null;
    uzasadnienie: string | null;
}

// Column name patterns to match (handles multi-line headers)
const COLUMN_PATTERNS: Record<keyof ParsedFormularz, RegExp[]> = {
    kod_rozdzialu: [/rozdział/i, /^3$/],
    kod_paragrafu: [/paragraf/i, /^4$/],
    zrodlo_finansowania: [/źródło\s*finansowania/i, /^5$/],
    typ_wydatku: [/grupa\s*wydatków/i, /^6$/],
    nazwa_zadania: [/nazwa\s*zadania/i],
    jednostka_realizujaca: [/komórki?\s*organizacyjn/i, /nazwa\s*komórki/i],
    rok_1: [/potrzeby\s*finansowe.*2026/i, /^17$/],
    rok_2: [/potrzeby\s*finansowe.*2027/i, /^22$/],
    rok_3: [/potrzeby\s*finansowe.*2028/i, /^27$/],
    rok_4: [/potrzeby\s*finansowe.*2029/i, /^32$/],
    uzasadnienie: [/uzasadnienie/i, /szczegółowe\s*uzasadnienie/i],
};

function findColumnIndex(headers: string[], patterns: RegExp[]): number {
    for (let i = 0; i < headers.length; i++) {
        const header = String(headers[i] || '').replace(/\n/g, ' ');
        for (const pattern of patterns) {
            if (pattern.test(header)) {
                return i;
            }
        }
    }
    return -1;
}

export function parseExcelFile(file: File): Promise<ParsedFormularz[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });

                // Use first sheet
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert to JSON with headers
                const jsonData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
                    header: 1, // Use array of arrays
                    defval: null,
                });

                if (jsonData.length < 2) {
                    reject(new Error('Plik Excel jest pusty lub nie zawiera danych'));
                    return;
                }

                // First row is header
                const headers = (jsonData[0] as unknown[]).map(h => String(h || ''));

                // Find column indices
                const columnMap: Record<keyof ParsedFormularz, number> = {
                    kod_rozdzialu: findColumnIndex(headers, COLUMN_PATTERNS.kod_rozdzialu),
                    kod_paragrafu: findColumnIndex(headers, COLUMN_PATTERNS.kod_paragrafu),
                    zrodlo_finansowania: findColumnIndex(headers, COLUMN_PATTERNS.zrodlo_finansowania),
                    typ_wydatku: findColumnIndex(headers, COLUMN_PATTERNS.typ_wydatku),
                    nazwa_zadania: findColumnIndex(headers, COLUMN_PATTERNS.nazwa_zadania),
                    jednostka_realizujaca: findColumnIndex(headers, COLUMN_PATTERNS.jednostka_realizujaca),
                    rok_1: findColumnIndex(headers, COLUMN_PATTERNS.rok_1),
                    rok_2: findColumnIndex(headers, COLUMN_PATTERNS.rok_2),
                    rok_3: findColumnIndex(headers, COLUMN_PATTERNS.rok_3),
                    rok_4: findColumnIndex(headers, COLUMN_PATTERNS.rok_4),
                    uzasadnienie: findColumnIndex(headers, COLUMN_PATTERNS.uzasadnienie),
                };

                // Parse data rows (skip header row and any sub-header rows)
                const results: ParsedFormularz[] = [];

                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i] as unknown[];

                    // Skip rows that look like sub-headers (e.g., row with just numbers 1,2,3...)
                    const firstCell = row[0];
                    if (firstCell === null || firstCell === undefined ||
                        (typeof firstCell === 'number' && firstCell <= 10)) {
                        continue;
                    }

                    const getValue = (key: keyof ParsedFormularz): string | null => {
                        const idx = columnMap[key];
                        if (idx === -1) return null;
                        const val = row[idx];
                        if (val === null || val === undefined) return null;
                        return String(val);
                    };

                    const getNumericValue = (key: keyof ParsedFormularz): number | null => {
                        const idx = columnMap[key];
                        if (idx === -1) return null;
                        const val = row[idx];
                        if (val === null || val === undefined) return null;
                        const num = parseFloat(String(val));
                        return isNaN(num) ? null : num;
                    };

                    const parsed: ParsedFormularz = {
                        kod_rozdzialu: getValue('kod_rozdzialu'),
                        kod_paragrafu: getValue('kod_paragrafu'),
                        zrodlo_finansowania: getValue('zrodlo_finansowania'),
                        typ_wydatku: getValue('typ_wydatku'),
                        nazwa_zadania: getValue('nazwa_zadania'),
                        jednostka_realizujaca: getValue('jednostka_realizujaca'),
                        rok_1: getNumericValue('rok_1'),
                        rok_2: getNumericValue('rok_2'),
                        rok_3: getNumericValue('rok_3'),
                        rok_4: getNumericValue('rok_4'),
                        uzasadnienie: getValue('uzasadnienie'),
                    };

                    // Only add if there's meaningful data
                    if (parsed.nazwa_zadania || parsed.rok_1 !== null) {
                        results.push(parsed);
                    }
                }

                resolve(results);
            } catch (error) {
                reject(new Error(`Błąd parsowania pliku Excel: ${error}`));
            }
        };

        reader.onerror = () => {
            reject(new Error('Błąd odczytu pliku'));
        };

        reader.readAsArrayBuffer(file);
    });
}
