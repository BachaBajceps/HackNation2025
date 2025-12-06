import { DictionaryItem, ChapterItem, TaskBudgetItem, ExpenditureGroupMapping } from '../types/budget';

import partsData from './generated/parts.json';
import sectionsData from './generated/sections.json';
import chaptersData from './generated/chapters.json';
import paragraphsData from './generated/paragraphs.json';
import taskBudgetData from './generated/taskBudget.json';

// Części budżetowe
export const parts: DictionaryItem[] = partsData as DictionaryItem[];

// Działy
export const sections: DictionaryItem[] = sectionsData as DictionaryItem[];

// Rozdziały
export const chapters: ChapterItem[] = chaptersData as ChapterItem[];

// Paragrafy
export const paragraphs: DictionaryItem[] = paragraphsData as DictionaryItem[];

// Budżet Zadaniowy
export const taskBudgets: TaskBudgetItem[] = taskBudgetData as unknown as TaskBudgetItem[];

// Źródła finansowania
export const financingSources: DictionaryItem[] = [
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
export const expenditureGroupMappings: ExpenditureGroupMapping[] = [
    { paragraphRangeStart: 200, paragraphRangeEnd: 299, group: 'Dotacje i subwencje' },
    { paragraphRangeStart: 300, paragraphRangeEnd: 399, group: 'Świadczenia na rzecz osób fizycznych' },
    { paragraphRangeStart: 400, paragraphRangeEnd: 498, group: 'Wydatki bieżące' },
    { paragraphRangeStart: 500, paragraphRangeEnd: 599, group: 'Rozliczenia' },
    { paragraphRangeStart: 600, paragraphRangeEnd: 699, group: 'Wydatki majątkowe' },
];

// Kategorie / Obszary działalności
export const categories: DictionaryItem[] = [
    { code: 'cyberbezpieczenstwo', name: 'Cyberbezpieczeństwo' },
    { code: 'sztuczna-inteligencja', name: 'Sztuczna inteligencja' },
    { code: 'koszty-funkcjonowania', name: 'Koszty funkcjonowania' },
    { code: 'inne', name: 'Inne' },
];

// Komórki organizacyjne (słownik wewnętrzny)
export const orgUnits: DictionaryItem[] = [
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
export const disposers: DictionaryItem[] = [
    { code: 'KPRM', name: 'Kancelaria Prezesa Rady Ministrów' },
    { code: 'MC', name: 'Ministerstwo Cyfryzacji' },
    { code: 'MF', name: 'Ministerstwo Finansów' },
    { code: 'MSWiA', name: 'Ministerstwo Spraw Wewnętrznych i Administracji' },
    { code: 'MNiSW', name: 'Ministerstwo Nauki i Szkolnictwa Wyższego' },
];
