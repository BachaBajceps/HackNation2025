import React, { useState } from 'react';
import { FormField } from '../FormField';
import { ComboBox } from '../ComboBox';
import './MinistryTaskForm.css';

// Opcje dla listy rozwijanej
const categoryOptions = [
    { code: 'komorka', name: 'Komórka organizacyjna' },
    { code: 'dzial', name: 'Dział' },
    { code: 'rozdzial', name: 'Rozdział' },
    { code: 'paragraf', name: 'Paragraf' },
    { code: 'czesc', name: 'Część budżetowa' }
];

interface MinistryTaskFormData {
    terminWykonania: string;
    rokBudzetu: string;
    kategoria: string;
    opisKategorii: string;
    wartosc: string;
}

export const MinistryTaskForm: React.FC = () => {
    const [showSuccess, setShowSuccess] = useState(false);
    const [formData, setFormData] = useState<MinistryTaskFormData>({
        terminWykonania: '',
        rokBudzetu: '',
        kategoria: '',
        opisKategorii: '',
        wartosc: ''
    });
    const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);

    const updateField = <K extends keyof MinistryTaskFormData>(
        field: K,
        value: MinistryTaskFormData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Usuń błąd dla tego pola
        setErrors(prev => prev.filter(e => e.field !== field));
    };

    const formatCurrency = (value: string): string => {
        // Pozwól tylko na cyfry i jeden przecinek/kropkę
        const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
        const parts = cleaned.split('.');
        if (parts.length > 2) {
            return parts[0] + '.' + parts.slice(1).join('');
        }
        // Ogranicz do 2 miejsc po przecinku
        if (parts.length === 2 && parts[1].length > 2) {
            return parts[0] + '.' + parts[1].substring(0, 2);
        }
        return cleaned;
    };

    const handleWartoscChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCurrency(e.target.value);
        updateField('wartosc', formatted);
    };

    const validate = (): { field: string; message: string }[] => {
        const newErrors: { field: string; message: string }[] = [];

        if (!formData.terminWykonania) {
            newErrors.push({ field: 'terminWykonania', message: 'Termin wykonania jest wymagany' });
        }

        if (!formData.rokBudzetu) {
            newErrors.push({ field: 'rokBudzetu', message: 'Rok budżetu jest wymagany' });
        } else {
            const rok = parseInt(formData.rokBudzetu);
            if (isNaN(rok) || rok < 2020 || rok > 2100) {
                newErrors.push({ field: 'rokBudzetu', message: 'Rok musi być między 2020 a 2100' });
            }
        }

        if (!formData.kategoria) {
            newErrors.push({ field: 'kategoria', message: 'Wybierz kategorię' });
        }

        if (!formData.opisKategorii.trim()) {
            newErrors.push({ field: 'opisKategorii', message: 'Opis kategorii jest wymagany' });
        }

        if (!formData.wartosc) {
            newErrors.push({ field: 'wartosc', message: 'Wartość jest wymagana' });
        } else if (isNaN(parseFloat(formData.wartosc)) || parseFloat(formData.wartosc) < 0) {
            newErrors.push({ field: 'wartosc', message: 'Wartość musi być liczbą nieujemną' });
        }

        return newErrors;
    };

    const getError = (field: string): string | undefined => {
        return errors.find(e => e.field === field)?.message;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validate();
        setErrors(validationErrors);

        if (validationErrors.length === 0) {
            try {
                const response = await fetch('/api/zadanie-ministerstwo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...formData,
                        wartosc: parseFloat(formData.wartosc).toFixed(2)
                    }),
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    setShowSuccess(true);
                    console.log('Ministry task saved with ID:', result.id);
                    setTimeout(() => {
                        setShowSuccess(false);
                        handleReset(true);
                    }, 3000);
                } else {
                    alert(`Błąd zapisu: ${result.error}\n${result.details || ''}`);
                }
            } catch (error) {
                alert(`Błąd połączenia: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
            }
        }
    };

    const handleReset = (skipConfirm = false) => {
        if (skipConfirm || confirm('Czy na pewno chcesz wyczyścić formularz?')) {
            setFormData({
                terminWykonania: '',
                rokBudzetu: '',
                kategoria: '',
                opisKategorii: '',
                wartosc: ''
            });
            setErrors([]);
        }
    };

    // Uzyskaj etykietę wybranej kategorii dla placeholdera
    const getKategoriaPlaceholder = (): string => {
        const selected = categoryOptions.find(opt => opt.code === formData.kategoria);
        return selected ? `Wpisz ${selected.name.toLowerCase()}...` : 'Najpierw wybierz kategorię...';
    };

    return (
        <form className="ministry-task-form" onSubmit={handleSubmit}>
            {showSuccess && (
                <div className="ministry-task-form__success">
                    ✓ Zadanie ministerstwa zapisane pomyślnie!
                </div>
            )}

            <section className="ministry-task-form__section">
                <h2 className="ministry-task-form__section-title">
                    <span className="ministry-task-form__section-icon">🏛️</span>
                    Formularz zadania od ministerstwa
                </h2>

                <div className="ministry-task-form__grid ministry-task-form__grid--3">
                    <FormField
                        label="Termin wykonania"
                        htmlFor="terminWykonania"
                        required
                        error={getError('terminWykonania')}
                    >
                        <input
                            type="date"
                            id="terminWykonania"
                            value={formData.terminWykonania}
                            onChange={(e) => updateField('terminWykonania', e.target.value)}
                            className="ministry-task-form__input"
                        />
                    </FormField>

                    <FormField
                        label="Rok budżetu"
                        htmlFor="rokBudzetu"
                        required
                        error={getError('rokBudzetu')}
                    >
                        <input
                            type="number"
                            id="rokBudzetu"
                            value={formData.rokBudzetu}
                            onChange={(e) => updateField('rokBudzetu', e.target.value)}
                            placeholder="np. 2025"
                            min="2020"
                            max="2100"
                            className="ministry-task-form__input"
                        />
                    </FormField>

                    <ComboBox
                        label="Kategoria"
                        value={formData.kategoria}
                        onChange={(val) => updateField('kategoria', val)}
                        options={categoryOptions}
                        required
                        error={getError('kategoria')}
                        placeholder="Wybierz kategorię..."
                    />
                </div>

                <div className="ministry-task-form__grid ministry-task-form__grid--1">
                    <FormField
                        label="Opis"
                        htmlFor="opisKategorii"
                        required
                        error={getError('opisKategorii')}
                        hint={formData.kategoria ? undefined : 'Najpierw wybierz kategorię'}
                    >
                        <input
                            type="text"
                            id="opisKategorii"
                            value={formData.opisKategorii}
                            onChange={(e) => updateField('opisKategorii', e.target.value)}
                            placeholder={getKategoriaPlaceholder()}
                            disabled={!formData.kategoria}
                            className="ministry-task-form__input"
                        />
                    </FormField>
                </div>

                <div className="ministry-task-form__grid ministry-task-form__grid--1">
                    <FormField
                        label="Wartość"
                        htmlFor="wartosc"
                        required
                        error={getError('wartosc')}
                    >
                        <div className="ministry-task-form__currency-wrapper">
                            <input
                                type="text"
                                id="wartosc"
                                value={formData.wartosc}
                                onChange={handleWartoscChange}
                                placeholder="0.00"
                                className="ministry-task-form__input ministry-task-form__input--currency"
                                inputMode="decimal"
                            />
                            <span className="ministry-task-form__currency-label">zł</span>
                        </div>
                    </FormField>
                </div>
            </section>

            {/* Błędy walidacji */}
            {errors.length > 0 && (
                <div className="ministry-task-form__errors">
                    <h3>Błędy walidacji</h3>
                    <ul>
                        {errors.map((err, idx) => (
                            <li key={idx} className="ministry-task-form__error-item">
                                {err.message}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Przyciski */}
            <div className="ministry-task-form__actions">
                <button type="button" className="ministry-task-form__btn ministry-task-form__btn--secondary" onClick={() => handleReset()}>
                    Wyczyść formularz
                </button>
                <button type="submit" className="ministry-task-form__btn ministry-task-form__btn--primary">
                    Zapisz zadanie
                </button>
            </div>
        </form>
    );
};
