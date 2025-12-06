import { useState, useCallback, useEffect } from 'react';
import { BudgetRow, createEmptyBudgetRow, YearKey, ValidationError } from '../types/budget';
import { chapters } from '../data/dictionaries';
import {
    getExpenditureGroup,
    extractTaskBudgetShort,
    calculateGap,
    isDotationParagraph,
    isValidTaskBudgetFormat
} from '../utils/calculations';

export function useBudgetForm(initialData?: BudgetRow) {
    const [formData, setFormData] = useState<BudgetRow>(
        initialData ?? createEmptyBudgetRow()
    );
    const [errors, setErrors] = useState<ValidationError[]>([]);
    const [isDirty, setIsDirty] = useState(false);

    // Filtrowane rozdziały na podstawie wybranego działu
    const filteredChapters = chapters.filter(
        ch => ch.parentSection === formData.section
    );

    // Aktualizacja pola formularza
    const updateField = useCallback(<K extends keyof BudgetRow>(
        field: K,
        value: BudgetRow[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    }, []);

    // Aktualizacja danych finansowych dla konkretnego roku
    const updateFinancial = useCallback((
        year: YearKey,
        field: keyof BudgetRow['financials'][YearKey],
        value: number | null | string
    ) => {
        setFormData(prev => {
            const yearData = { ...prev.financials[year], [field]: value };

            // Przelicz gap
            if (field === 'needs' || field === 'limit') {
                yearData.gap = calculateGap(yearData.needs, yearData.limit);
            }

            return {
                ...prev,
                financials: {
                    ...prev.financials,
                    [year]: yearData
                }
            };
        });
        setIsDirty(true);
    }, []);

    // Automatyczna aktualizacja grupy wydatków przy zmianie paragrafu
    useEffect(() => {
        if (formData.paragraph) {
            const group = getExpenditureGroup(formData.paragraph);
            if (group !== formData.expenditureGroup) {
                setFormData(prev => ({ ...prev, expenditureGroup: group }));
            }
        }
    }, [formData.paragraph, formData.expenditureGroup]);

    // Automatyczna aktualizacja skrótu budżetu zadaniowego
    useEffect(() => {
        if (formData.taskBudgetFull) {
            const short = extractTaskBudgetShort(formData.taskBudgetFull);
            if (short !== formData.taskBudgetFunction) {
                setFormData(prev => ({ ...prev, taskBudgetFunction: short }));
            }
        }
    }, [formData.taskBudgetFull, formData.taskBudgetFunction]);

    // Automatyczne ustawienie "nie dotyczy" dla nazwy projektu gdy źródło = 0
    useEffect(() => {
        if (formData.financingSource === '0') {
            if (formData.projectName !== 'nie dotyczy') {
                setFormData(prev => ({ ...prev, projectName: 'nie dotyczy' }));
            }
        }
    }, [formData.financingSource, formData.projectName]);

    // Czyszczenie rozdziału gdy zmienia się dział
    const handleSectionChange = useCallback((newSection: string) => {
        setFormData(prev => ({
            ...prev,
            section: newSection,
            chapter: '' // Reset chapter when section changes
        }));
        setIsDirty(true);
    }, []);

    // Walidacja formularza
    const validate = useCallback((): ValidationError[] => {
        const newErrors: ValidationError[] = [];

        // Wymagane pola
        if (!formData.part) {
            newErrors.push({ field: 'part', message: 'Część budżetowa jest wymagana', type: 'error' });
        }
        if (!formData.section) {
            newErrors.push({ field: 'section', message: 'Dział jest wymagany', type: 'error' });
        }
        if (!formData.chapter) {
            newErrors.push({ field: 'chapter', message: 'Rozdział jest wymagany', type: 'error' });
        }
        if (!formData.paragraph) {
            newErrors.push({ field: 'paragraph', message: 'Paragraf jest wymagany', type: 'error' });
        }
        if (!formData.financingSource) {
            newErrors.push({ field: 'financingSource', message: 'Źródło finansowania jest wymagane', type: 'error' });
        }
        if (!formData.taskBudgetFull) {
            newErrors.push({ field: 'taskBudgetFull', message: 'Budżet zadaniowy jest wymagany', type: 'error' });
        } else if (!isValidTaskBudgetFormat(formData.taskBudgetFull)) {
            newErrors.push({ field: 'taskBudgetFull', message: 'Nieprawidłowy format (wymagany: XX.XX.XX.XX)', type: 'error' });
        }

        // Nazwa projektu wymagana gdy źródło != 0
        if (formData.financingSource !== '0' && formData.financingSource && !formData.projectName) {
            newErrors.push({ field: 'projectName', message: 'Nazwa programu/projektu jest wymagana dla tego źródła finansowania', type: 'error' });
        }

        // Walidacja dotacji
        if (isDotationParagraph(formData.paragraph)) {
            if (!formData.grantRecipient) {
                newErrors.push({ field: 'grantRecipient', message: 'Beneficjent dotacji jest wymagany dla paragrafów dotacyjnych', type: 'error' });
            }
            if (!formData.grantLegalBasis) {
                newErrors.push({ field: 'grantLegalBasis', message: 'Podstawa prawna dotacji jest wymagana', type: 'error' });
            }
        }

        // Walidacja danych finansowych
        const years: YearKey[] = ['2026', '2027', '2028', '2029'];
        years.forEach(year => {
            const yearData = formData.financials[year];

            // Kwota umowy > 0 wymaga nr umowy
            if (yearData.contractedAmount && yearData.contractedAmount > 0 && !yearData.contractNumber) {
                newErrors.push({
                    field: `financials.${year}.contractNumber`,
                    message: `Nr umowy wymagany dla roku ${year} (kwota umowy > 0)`,
                    type: 'error'
                });
            }

            // Ostrzeżenie gdy kwota umowy > limit
            if (yearData.contractedAmount && yearData.limit && yearData.contractedAmount > yearData.limit) {
                newErrors.push({
                    field: `financials.${year}.contractedAmount`,
                    message: `Kwota umowy przekracza limit w roku ${year}`,
                    type: 'warning'
                });
            }
        });

        setErrors(newErrors);
        return newErrors;
    }, [formData]);

    // Reset formularza
    const reset = useCallback(() => {
        setFormData(createEmptyBudgetRow());
        setErrors([]);
        setIsDirty(false);
    }, []);

    // Sprawdzenie czy pole ma błąd
    const hasError = useCallback((field: string): boolean => {
        return errors.some(e => e.field === field && e.type === 'error');
    }, [errors]);

    // Pobranie komunikatu błędu dla pola
    const getError = useCallback((field: string): string | undefined => {
        return errors.find(e => e.field === field)?.message;
    }, [errors]);

    // Sprawdzenie czy pole ma ostrzeżenie
    const hasWarning = useCallback((field: string): boolean => {
        return errors.some(e => e.field === field && e.type === 'warning');
    }, [errors]);

    return {
        formData,
        errors,
        isDirty,
        filteredChapters,
        updateField,
        updateFinancial,
        handleSectionChange,
        validate,
        reset,
        hasError,
        getError,
        hasWarning,
        setFormData,
    };
}
