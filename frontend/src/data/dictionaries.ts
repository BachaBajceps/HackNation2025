import { ElementSlownika, ElementRozdzialu, ElementBudzetuZadaniowego, MapowanieGrupyWydatkow } from '../types/budget';

import partsData from './dane_formularzy/czesci.json';
import sectionsData from './dane_formularzy/dzialy.json';
import chaptersData from './dane_formularzy/rozdzialy.json';
import paragraphsData from './dane_formularzy/paragrafy.json';
import taskBudgetData from './dane_formularzy/zadania_budzetowe.json';
import departmentsData from './dane_formularzy/departamenty.json';

// Części budżetowe
export const parts: ElementSlownika[] = partsData as ElementSlownika[];
// Działy
export const sections: ElementSlownika[] = sectionsData as ElementSlownika[];
// Rozdziały
export const chapters: ElementRozdzialu[] = chaptersData as ElementRozdzialu[];
// Paragrafy
export const paragraphs: ElementSlownika[] = paragraphsData as ElementSlownika[];
// Zadania budżetowe
export const taskBudgets: ElementBudzetuZadaniowego[] = taskBudgetData as unknown as ElementBudzetuZadaniowego[];
// Departamenty
export const departments: ElementSlownika[] = departmentsData as ElementSlownika[];

// Źródła finansowania
export const financingSources: ElementSlownika[] = [
    { code: '0', name: 'Budżet państwa' },
    { code: '1', name: 'Środki z Unii Europejskiej (EFRR)' },
    { code: '2', name: 'Środki z Unii Europejskiej (EFS)' },
    { code: '3', name: 'Środki z Unii Europejskiej (FS)' },
    { code: '4', name: 'Środki z Unii Europejskiej (KPO)' },
    { code: '5', name: 'Środki ze źródeł zagranicznych niepodlegające zwrotowi' },
    { code: '6', name: 'Środki ze źródeł zagranicznych podlegające zwrotowi' },
    { code: '7', name: 'Środki Funduszu Pomocy' },
    { code: '8', name: 'Środki własne jednostek' },
    { code: '9', name: 'Inne źródła' },
];

// Mapowanie paragrafów na grupy wydatków
export const expenditureGroupMappings: MapowanieGrupyWydatkow[] = [
    { poczatekZakresu: 200, koniecZakresu: 299, grupa: 'Dotacje i subwencje' },
    { poczatekZakresu: 300, koniecZakresu: 399, grupa: 'Świadczenia na rzecz osób fizycznych' },
    { poczatekZakresu: 400, koniecZakresu: 498, grupa: 'Wydatki bieżące' },
    { poczatekZakresu: 500, koniecZakresu: 599, grupa: 'Rozliczenia' },
    { poczatekZakresu: 600, koniecZakresu: 699, grupa: 'Wydatki majątkowe' },
];

// Kategorie / Obszary działalności
export const categories: ElementSlownika[] = [
    { code: 'cyberbezpieczenstwo', name: 'Cyberbezpieczeństwo' },
    { code: 'sztuczna-inteligencja', name: 'Sztuczna inteligencja' },
    { code: 'koszty-funkcjonowania', name: 'Koszty funkcjonowania' },
    { code: 'inne', name: 'Inne' },
];

// Komórki organizacyjne (słownik wewnętrzny)
export const orgUnits: ElementSlownika[] = [
    { code: 'DA', name: 'Departament Administracji' },
    { code: 'DI', name: 'Departament Informatyzacji' },
    { code: 'DF', name: 'Departament Finansów' },
    { code: 'DC', name: 'Departament Cyberbezpieczeństwa' },
    { code: 'DN', name: 'Departament Nauki' },
    { code: 'BF', name: 'Biuro Finansowe' },
    { code: 'BK', name: 'Biuro Kadr' },
    { code: 'BP', name: 'Biuro Prawne' },
    { code: 'BI', name: 'Biuro Informatyki' },
];

// Dysponenci
export const disposers: ElementSlownika[] = [
    { code: 'KPRM', name: 'Kancelaria Prezesa Rady Ministrów' },
    { code: 'MC', name: 'Ministerstwo Cyfryzacji' },
    { code: 'MF', name: 'Ministerstwo Finansów' },
    { code: 'MSWiA', name: 'Ministerstwo Spraw Wewnętrznych i Administracji' },
    { code: 'MNiSW', name: 'Ministerstwo Nauki i Szkolnictwa Wyższego' },
];
