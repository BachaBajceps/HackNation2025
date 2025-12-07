import React, { useState } from 'react';
import { useBudgetForm } from '../../hooks/useBudgetForm';
import { FormField } from '../FormField';
import { FinancialYearGrid } from '../FinancialYearGrid';
import {
    parts,
    sections,
    paragraphs,
    financingSources,
    taskBudgets,
    departments
} from '../../data/dictionaries';
import { isDotationParagraph } from '../../utils/calculations';
import './BudgetForm.css';
import { saveBudgetRow } from '../../services/api';

import { ComboBox } from '../ComboBox';

// ... (imports remain the same, ensure ComboBox is imported)

export const BudgetForm: React.FC = () => {
    const [showSuccess, setShowSuccess] = useState(false);
    const {
        formData,
        errors,
        filtrowaneRozdzialy,
        updateField,
        updateFinancial,
        handleSectionChange,
        validate,
        reset,
        getError,
    } = useBudgetForm();

    const isProjectNameDisabled = formData.zrodloFinansowania === '0';
    const showDotationFields = isDotationParagraph(formData.paragraf);

    // Helper to format options as "Code - Name"
    const formatOptions = (items: { code: string; name: string }[]) =>
        items.map(item => ({
            code: item.code,
            name: `${item.code} - ${item.name}`
        }));

    // Filtruj budżety zadaniowe - wszystkie poziomy
    const fullTaskBudgets = taskBudgets;

    const [matchingTask, setMatchingTask] = useState<{ taskId: number; description: string; matchedConstraint: string } | null>(null);

    // Check for matching tasks when key fields change
    React.useEffect(() => {
        const checkTask = async () => {
            if (!formData.czesc && !formData.dzial && !formData.komorkaOrganizacyjna) {
                setMatchingTask(null);
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/api/find-task', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        czesc: formData.czesc,
                        dzial: formData.dzial,
                        rozdzial: formData.rozdzial,
                        paragraf: formData.paragraf,
                        komorkaOrganizacyjna: formData.komorkaOrganizacyjna
                    })
                });

                const result = await response.json();
                if (result.found) {
                    setMatchingTask({
                        taskId: result.taskId,
                        description: result.description,
                        matchedConstraint: result.matchedConstraint
                    });
                } else {
                    setMatchingTask(null);
                }
            } catch (err) {
                console.error('Error checking task:', err);
            }
        };

        const timeoutId = setTimeout(checkTask, 500); // Debounce
        return () => clearTimeout(timeoutId);
    }, [formData.czesc, formData.dzial, formData.rozdzial, formData.paragraf, formData.komorkaOrganizacyjna]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validate();

        if (validationErrors.filter(err => err.type === 'error').length === 0) {
            // Call backend API
            const result = await saveBudgetRow(formData);

            if (result.success) {
                setShowSuccess(true);
                console.log('Zapisano z ID:', result.id);
                setTimeout(() => {
                    setShowSuccess(false);
                    reset(); // Reset form after successful save
                }, 3000);
            } else {
                // Show error message to user
                alert(`Błąd zapisu: ${result.error}\n${result.details || ''}`);
            }
        }
    };

    const handleReset = () => {
        if (confirm('Czy na pewno chcesz wyczyścić formularz?')) {
            reset();
        }
    };

    return (
        <form className="budget-form" onSubmit={handleSubmit}>
            {showSuccess && (
                <div className="budget-form__success">
                    ✓ Formularz zapisany pomyślnie!
                </div>
            )}

            {/* Sekcja 0: Powiązanie z zadaniem ministerstwa */}
            {matchingTask && (
                <section className="budget-form__section budget-form__section--highlight">
                    <div className="budget-form__grid budget-form__grid--1">
                        <FormField
                            label="Przypisane zadanie od ministerstwa"
                            htmlFor="linkedTask"
                            readOnly
                            hint={`Na podstawie: ${matchingTask.matchedConstraint}`}
                        >
                            <input
                                type="text"
                                id="linkedTask"
                                value={matchingTask.description}
                                readOnly
                                className="budget-form__input--readonly-highlight"
                            />
                        </FormField>
                    </div>
                </section>
            )}

            {/* Sekcja 1: Klasyfikacja budżetowa */}
            <section className="budget-form__section">
                <h2 className="budget-form__section-title">
                    <span className="budget-form__section-icon">📋</span>
                    Klasyfikacja budżetowa
                </h2>

                <div className="budget-form__grid budget-form__grid--6">
                    <ComboBox
                        label="Część"
                        value={formData.czesc}
                        onChange={(val) => updateField('czesc', val)}
                        options={formatOptions(parts)}
                        required
                        error={getError('czesc')}
                        placeholder="Wybierz..."
                    />

                    <ComboBox
                        label="Dział"
                        value={formData.dzial}
                        onChange={(val) => handleSectionChange(val)}
                        options={formatOptions(sections)}
                        required
                        error={getError('dzial')}
                        placeholder="Wybierz..."
                    />

                    <ComboBox
                        label="Rozdział"
                        value={formData.rozdzial}
                        onChange={(val) => updateField('rozdzial', val)}
                        options={formatOptions(filtrowaneRozdzialy)}
                        required
                        error={getError('rozdzial')}
                        disabled={!formData.dzial}
                        placeholder={filtrowaneRozdzialy.length === 0 && formData.dzial ? 'Brak danych' : "Wybierz..."}
                        warning={filtrowaneRozdzialy.length === 0 && formData.dzial ? 'Brak rozdziałów dla wybranego działu' : undefined}
                    />

                    <ComboBox
                        label="Paragraf"
                        value={formData.paragraf}
                        onChange={(val) => updateField('paragraf', val)}
                        options={formatOptions(paragraphs)}
                        required
                        error={getError('paragraf')}
                        placeholder="Wybierz..."
                    />

                    <ComboBox
                        label="Źródło finansowania"
                        value={formData.zrodloFinansowania}
                        onChange={(val) => updateField('zrodloFinansowania', val)}
                        options={formatOptions(financingSources)}
                        required
                        error={getError('zrodloFinansowania')}
                        placeholder="Wybierz..."
                    />
                </div>
            </section>

            {/* Sekcja 2: Budżet Zadaniowy */}
            <section className="budget-form__section">
                <h2 className="budget-form__section-title">
                    <span className="budget-form__section-icon">🎯</span>
                    Budżet Zadaniowy
                </h2>

                <div className="budget-form__grid budget-form__grid--2">
                    <ComboBox
                        label="Funkcja / Zadanie / Podzadanie / Działanie"
                        value={formData.budzetZadaniowyPelny}
                        onChange={(val) => updateField('budzetZadaniowyPelny', val)}
                        options={formatOptions(fullTaskBudgets)}
                        required
                        error={getError('budzetZadaniowyPelny')}
                        placeholder="Wybierz zadanie (X.X.X.X)..."
                    />

                    <FormField
                        label="Funkcja i zadanie (skrót)"
                        htmlFor="taskBudgetFunction"
                        readOnly
                        hint="Automatycznie z pełnego kodu"
                    >
                        <input
                            type="text"
                            id="taskBudgetFunction"
                            value={formData.funkcjaZadanie}
                            readOnly
                        />
                    </FormField>
                </div>
            </section>

            {/* Sekcja 3: Dane organizacyjne */}
            <section className="budget-form__section">
                <h2 className="budget-form__section-title">
                    <span className="budget-form__section-icon">🏢</span>
                    Dane organizacyjne
                </h2>

                <div className="budget-form__grid budget-form__grid--3">
                    <FormField
                        label="Nazwa programu/projektu"
                        htmlFor="projectName"
                        required={!isProjectNameDisabled}
                        disabled={isProjectNameDisabled}
                        error={getError('nazwaProjektu')}
                    >
                        <input
                            type="text"
                            id="projectName"
                            value={formData.nazwaProjektu}
                            onChange={(e) => updateField('nazwaProjektu', e.target.value)}
                            disabled={isProjectNameDisabled}
                            placeholder={isProjectNameDisabled ? 'nie dotyczy' : 'Nazwa programu...'}
                        />
                    </FormField>

                    <ComboBox
                        label="Nazwa komórki organizacyjnej"
                        value={formData.komorkaOrganizacyjna}
                        onChange={(val) => updateField('komorkaOrganizacyjna', val)}
                        options={formatOptions(departments)}
                        placeholder="Wybierz departament..."
                    />

                    <FormField
                        label="Dysponent środków"
                        htmlFor="disposer"
                    >
                        <input
                            type="text"
                            id="disposer"
                            value={formData.dysponent}
                            onChange={(e) => updateField('dysponent', e.target.value)}
                            placeholder="Wpisz dysponenta..."
                        />
                    </FormField>
                </div>

                <div className="budget-form__grid budget-form__grid--3">
                    <FormField
                        label="Plan WI"
                        htmlFor="planWI"
                    >
                        <input
                            type="text"
                            id="planWI"
                            value={formData.planWI}
                            onChange={(e) => updateField('planWI', e.target.value)}
                            placeholder="Plan WI..."
                        />
                    </FormField>

                    <FormField
                        label="Budżet"
                        htmlFor="budgetCode"
                    >
                        <input
                            type="text"
                            id="budgetCode"
                            value={formData.kodBudzetu}
                            onChange={(e) => updateField('kodBudzetu', e.target.value)}
                            placeholder="Kod budżetu..."
                        />
                    </FormField>

                    <FormField
                        label="Przeznaczenie wydatków"
                        htmlFor="category"
                    >
                        <input
                            type="text"
                            id="category"
                            value={formData.przeznaczenie}
                            onChange={(e) => updateField('przeznaczenie', e.target.value)}
                            placeholder="Wpisz przeznaczenie..."
                        />
                    </FormField>
                </div>
            </section>

            {/* Sekcja 4: Nazwa i uzasadnienie */}
            <section className="budget-form__section">
                <h2 className="budget-form__section-title">
                    <span className="budget-form__section-icon">📝</span>
                    Opis zadania
                </h2>

                <div className="budget-form__grid budget-form__grid--1">
                    <FormField
                        label="Nazwa zadania"
                        htmlFor="taskName"
                    >
                        <input
                            type="text"
                            id="taskName"
                            value={formData.nazwaZadania}
                            onChange={(e) => updateField('nazwaZadania', e.target.value)}
                            placeholder="Krótki, zwięzły tytuł zadania..."
                        />
                    </FormField>
                </div>

                <div className="budget-form__grid budget-form__grid--1">
                    <FormField
                        label="Szczegółowe uzasadnienie realizacji zadania"
                        htmlFor="justification"
                    >
                        <textarea
                            id="justification"
                            value={formData.uzasadnienie}
                            onChange={(e) => updateField('uzasadnienie', e.target.value)}
                            placeholder="Szczegółowy opis potrzeby biznesowej..."
                            rows={4}
                        />
                    </FormField>
                </div>
            </section>

            {/* Sekcja 5: Dane finansowe */}
            <section className="budget-form__section budget-form__section--full">
                <h2 className="budget-form__section-title">
                    <span className="budget-form__section-icon">💰</span>
                    Dane finansowe (2026-2029)
                </h2>

                <FinancialYearGrid
                    daneFinansowe={formData.daneFinansowe}
                    onUpdate={updateFinancial}
                    errors={errors}
                />
            </section>

            {/* Sekcja 6: Dotacje (warunkowo) */}
            {showDotationFields && (
                <section className="budget-form__section budget-form__section--highlight">
                    <h2 className="budget-form__section-title">
                        <span className="budget-form__section-icon">🎁</span>
                        Informacje o dotacji
                    </h2>

                    <div className="budget-form__grid budget-form__grid--2">
                        <FormField
                            label="W przypadku dotacji - z kim zawarta umowa"
                            htmlFor="grantRecipient"
                            error={getError('beneficjentDotacji')}
                        >
                            <input
                                type="text"
                                id="grantRecipient"
                                value={formData.beneficjentDotacji}
                                onChange={(e) => updateField('beneficjentDotacji', e.target.value)}
                                placeholder="Nazwa beneficjenta..."
                            />
                        </FormField>

                        <FormField
                            label="Podstawa prawna udzielenia dotacji"
                            htmlFor="grantLegalBasis"
                            error={getError('podstawaPrawnaDotacji')}
                        >
                            <input
                                type="text"
                                id="grantLegalBasis"
                                value={formData.podstawaPrawnaDotacji}
                                onChange={(e) => updateField('podstawaPrawnaDotacji', e.target.value)}
                                placeholder="Ustawa, rozporządzenie..."
                            />
                        </FormField>
                    </div>
                </section>
            )}

            {/* Sekcja 7: Uwagi */}
            <section className="budget-form__section">
                <h2 className="budget-form__section-title">
                    <span className="budget-form__section-icon">💬</span>
                    Uwagi
                </h2>

                <div className="budget-form__grid budget-form__grid--1">
                    <FormField
                        label="Uwagi"
                        htmlFor="comments"
                    >
                        <textarea
                            id="comments"
                            value={formData.uwagi}
                            onChange={(e) => updateField('uwagi', e.target.value)}
                            placeholder="Opcjonalne uwagi..."
                            rows={3}
                        />
                    </FormField>
                </div>
            </section>

            {/* Błędy walidacji */}
            {errors.length > 0 && (
                <div className="budget-form__errors">
                    <h3>Błędy walidacji</h3>
                    <ul>
                        {errors.map((err, idx) => (
                            <li key={idx} className={`budget-form__error-item budget-form__error-item--${err.type}`}>
                                {err.message}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Przyciski */}
            <div className="budget-form__actions">
                <button type="button" className="budget-form__btn budget-form__btn--secondary" onClick={handleReset}>
                    Wyczyść formularz
                </button>
                <button type="submit" className="budget-form__btn budget-form__btn--primary">
                    Zapisz wiersz budżetowy
                </button>
            </div>
        </form>
    );
};
