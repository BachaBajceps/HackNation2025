import { useState, useCallback, useEffect } from 'react';
import { WierszBudzetowy, utworzPustyWiersz, KluczRoku, ValidationError } from '../types/budget';
import { chapters } from '../data/dictionaries';
import {
    getExpenditureGroup,
    extractTaskBudgetShort,
    calculateGap,
    isValidTaskBudgetFormat
} from '../utils/calculations';

export function useBudgetForm(initialData?: WierszBudzetowy) {
    const [formData, setFormData] = useState<WierszBudzetowy>(
        initialData ?? utworzPustyWiersz()
    );
    const [errors, setErrors] = useState<ValidationError[]>([]);
    const [isDirty, setIsDirty] = useState(false);

    // Filtrowane rozdziały na podstawie wybranego działu
    const filtrowaneRozdzialy = chapters.filter(
        ch => ch.parentSection === formData.dzial
    );

    // Aktualizacja pola formularza
    const updateField = useCallback(<K extends keyof WierszBudzetowy>(
        field: K,
        value: WierszBudzetowy[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    }, []);

    // Aktualizacja danych finansowych dla konkretnego roku
    const updateFinancial = useCallback((
        rok: KluczRoku,
        field: keyof WierszBudzetowy['daneFinansowe'][KluczRoku],
        value: number | null | string
    ) => {
        setFormData(prev => {
            const daneRoku = { ...prev.daneFinansowe[rok], [field]: value };

            // Przelicz gap (różnicę)
            if (field === 'potrzeby' || field === 'limit') {
                daneRoku.roznica = calculateGap(daneRoku.potrzeby, daneRoku.limit);
            }

            return {
                ...prev,
                daneFinansowe: {
                    ...prev.daneFinansowe,
                    [rok]: daneRoku
                }
            };
        });
        setIsDirty(true);
    }, []);

    // Automatyczna aktualizacja grupy wydatków przy zmianie paragrafu
    useEffect(() => {
        if (formData.paragraf) {
            const grupa = getExpenditureGroup(formData.paragraf);
            if (grupa !== formData.grupaWydatkow) {
                setFormData(prev => ({ ...prev, grupaWydatkow: grupa }));
            }
        }
    }, [formData.paragraf, formData.grupaWydatkow]);

    // Automatyczna aktualizacja skrótu budżetu zadaniowego
    useEffect(() => {
        if (formData.budzetZadaniowyPelny) {
            const skrot = extractTaskBudgetShort(formData.budzetZadaniowyPelny);
            if (skrot !== formData.funkcjaZadanie) {
                setFormData(prev => ({ ...prev, funkcjaZadanie: skrot }));
            }
        }
    }, [formData.budzetZadaniowyPelny, formData.funkcjaZadanie]);

    // Automatyczne ustawienie "nie dotyczy" dla nazwy projektu gdy źródło = 0
    useEffect(() => {
        if (formData.zrodloFinansowania === '0') {
            if (formData.nazwaProjektu !== 'nie dotyczy') {
                setFormData(prev => ({ ...prev, nazwaProjektu: 'nie dotyczy' }));
            }
        }
    }, [formData.zrodloFinansowania, formData.nazwaProjektu]);

    // Czyszczenie rozdziału gdy zmienia się dział
    const handleSectionChange = useCallback((nowyDzial: string) => {
        setFormData(prev => ({
            ...prev,
            dzial: nowyDzial,
            rozdzial: '' // Reset chapter when section changes
        }));
        setIsDirty(true);
    }, []);

    // Walidacja formularza
    const validate = useCallback((): ValidationError[] => {
        const newErrors: ValidationError[] = [];

        // Wymagane pola
        if (!formData.czesc) {
            newErrors.push({ field: 'czesc', message: 'Część budżetowa jest wymagana', type: 'error' });
        }
        if (!formData.dzial) {
            newErrors.push({ field: 'dzial', message: 'Dział jest wymagany', type: 'error' });
        }
        if (!formData.rozdzial) {
            newErrors.push({ field: 'rozdzial', message: 'Rozdział jest wymagany', type: 'error' });
        }
        if (!formData.paragraf) {
            newErrors.push({ field: 'paragraf', message: 'Paragraf jest wymagany', type: 'error' });
        }
        if (!formData.zrodloFinansowania) {
            newErrors.push({ field: 'zrodloFinansowania', message: 'Źródło finansowania jest wymagane', type: 'error' });
        }
        if (!formData.budzetZadaniowyPelny) {
            newErrors.push({ field: 'budzetZadaniowyPelny', message: 'Budżet zadaniowy jest wymagany', type: 'error' });
        } else if (!isValidTaskBudgetFormat(formData.budzetZadaniowyPelny)) {
            newErrors.push({ field: 'budzetZadaniowyPelny', message: 'Nieprawidłowy format (wymagany: X.X.X.X)', type: 'error' });
        }

        // Nazwa projektu wymagana gdy źródło != 0
        if (formData.zrodloFinansowania !== '0' && formData.zrodloFinansowania && !formData.nazwaProjektu) {
            newErrors.push({ field: 'nazwaProjektu', message: 'Nazwa programu/projektu jest wymagana dla tego źródła finansowania', type: 'error' });
        }

        // Walidacja dotacji
        // if (isDotationParagraph(formData.paragraf)) {
        //     if (!formData.beneficjentDotacji) {
        //         newErrors.push({ field: 'beneficjentDotacji', message: 'Beneficjent dotacji jest wymagany dla paragrafów dotacyjnych', type: 'error' });
        //     }
        //     if (!formData.podstawaPrawnaDotacji) {
        //         newErrors.push({ field: 'podstawaPrawnaDotacji', message: 'Podstawa prawna dotacji jest wymagana', type: 'error' });
        //     }
        // }

        // Walidacja danych finansowych
        const lata: KluczRoku[] = ['2026', '2027', '2028', '2029'];
        lata.forEach(rok => {
            const daneRoku = formData.daneFinansowe[rok];

            // Kwota umowy > 0 wymaga nr umowy
            if (daneRoku.zaangazowanie && daneRoku.zaangazowanie > 0 && !daneRoku.nrUmowy) {
                newErrors.push({
                    field: `daneFinansowe.${rok}.nrUmowy`,
                    message: `Nr umowy wymagany dla roku ${rok} (kwota umowy > 0)`,
                    type: 'error'
                });
            }

            // Ostrzeżenie gdy kwota umowy > limit
            if (daneRoku.zaangazowanie && daneRoku.limit && daneRoku.zaangazowanie > daneRoku.limit) {
                newErrors.push({
                    field: `daneFinansowe.${rok}.zaangazowanie`,
                    message: `Kwota umowy przekracza limit w roku ${rok}`,
                    type: 'warning'
                });
            }
        });

        setErrors(newErrors);
        return newErrors;
    }, [formData]);

    // Reset formularza
    const reset = useCallback(() => {
        setFormData(utworzPustyWiersz());
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
        filtrowaneRozdzialy,
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
