import React, { useState } from 'react';
import { useBudgetForm } from '../../hooks/useBudgetForm';
import { FormField } from '../FormField';
import { FinancialYearGrid } from '../FinancialYearGrid';
import {
    parts,
    sections,
    paragraphs,
    financingSources,
    taskBudgets
} from '../../data/dictionaries';
import { isDotationParagraph } from '../../utils/calculations';
import './BudgetForm.css';

import { ComboBox } from '../ComboBox';

// ... (imports remain the same, ensure ComboBox is imported)

export const BudgetForm: React.FC = () => {
    const [showSuccess, setShowSuccess] = useState(false);
    const {
        formData,
        errors,
        filteredChapters,
        updateField,
        updateFinancial,
        handleSectionChange,
        validate,
        reset,
        hasError,
        getError,
        hasWarning,
    } = useBudgetForm();

    const isProjectNameDisabled = formData.financingSource === '0';
    const showDotationFields = isDotationParagraph(formData.paragraph);

    // Helper to format options as "Code - Name"
    const formatOptions = (items: { code: string; name: string }[]) =>
        items.map(item => ({
            code: item.code,
            name: `${item.code} - ${item.name}`
        }));

    // Filtruj budżety zadaniowe - wszystkie poziomy
    const fullTaskBudgets = taskBudgets;

    const handleSubmit = (e: React.FormEvent) => {
        // ... (remains same)
        e.preventDefault();
        const validationErrors = validate();

        if (validationErrors.filter(err => err.type === 'error').length === 0) {
            setShowSuccess(true);
            console.log('Form data:', formData);
            setTimeout(() => setShowSuccess(false), 3000);
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

            {/* Sekcja 1: Klasyfikacja budżetowa */}
            <section className="budget-form__section">
                <h2 className="budget-form__section-title">
                    <span className="budget-form__section-icon">📋</span>
                    Klasyfikacja budżetowa
                </h2>

                <div className="budget-form__grid budget-form__grid--6">
                    <ComboBox
                        label="Część"
                        value={formData.part}
                        onChange={(val) => updateField('part', val)}
                        options={formatOptions(parts)}
                        required
                        error={getError('part')}
                        placeholder="Wybierz..."
                    />

                    <ComboBox
                        label="Dział"
                        value={formData.section}
                        onChange={(val) => handleSectionChange(val)}
                        options={formatOptions(sections)}
                        required
                        error={getError('section')}
                        placeholder="Wybierz..."
                    />

                    <ComboBox
                        label="Rozdział"
                        value={formData.chapter}
                        onChange={(val) => updateField('chapter', val)}
                        options={formatOptions(filteredChapters)}
                        required
                        error={getError('chapter')}
                        disabled={!formData.section}
                        placeholder={filteredChapters.length === 0 && formData.section ? 'Brak danych' : "Wybierz..."}
                        warning={filteredChapters.length === 0 && formData.section ? 'Brak rozdziałów dla wybranego działu' : undefined}
                    />

                    <ComboBox
                        label="Paragraf"
                        value={formData.paragraph}
                        onChange={(val) => updateField('paragraph', val)}
                        options={formatOptions(paragraphs)}
                        required
                        error={getError('paragraph')}
                        placeholder="Wybierz..."
                    />

                    <ComboBox
                        label="Źródło finansowania"
                        value={formData.financingSource}
                        onChange={(val) => updateField('financingSource', val)}
                        options={formatOptions(financingSources)}
                        required
                        error={getError('financingSource')}
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
                        value={formData.taskBudgetFull}
                        onChange={(val) => updateField('taskBudgetFull', val)}
                        options={formatOptions(fullTaskBudgets)}
                        required
                        error={getError('taskBudgetFull')}
                        placeholder="Wybierz zadanie (XX.XX.XX.XX)..."
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
                            value={formData.taskBudgetFunction}
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
                        error={getError('projectName')}
                    >
                        <input
                            type="text"
                            id="projectName"
                            value={formData.projectName}
                            onChange={(e) => updateField('projectName', e.target.value)}
                            disabled={isProjectNameDisabled}
                            placeholder={isProjectNameDisabled ? 'nie dotyczy' : 'Nazwa programu...'}
                        />
                    </FormField>

                    <FormField
                        label="Nazwa komórki organizacyjnej"
                        htmlFor="orgUnit"
                    >
                        <input
                            type="text"
                            id="orgUnit"
                            value={formData.orgUnit}
                            onChange={(e) => updateField('orgUnit', e.target.value)}
                            placeholder="Wpisz komórkę..."
                        />
                    </FormField>

                    <FormField
                        label="Dysponent środków"
                        htmlFor="disposer"
                    >
                        <input
                            type="text"
                            id="disposer"
                            value={formData.disposer}
                            onChange={(e) => updateField('disposer', e.target.value)}
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
                            value={formData.budgetCode}
                            onChange={(e) => updateField('budgetCode', e.target.value)}
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
                            value={formData.category}
                            onChange={(e) => updateField('category', e.target.value)}
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
                            value={formData.taskName}
                            onChange={(e) => updateField('taskName', e.target.value)}
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
                            value={formData.justification}
                            onChange={(e) => updateField('justification', e.target.value)}
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
                    financials={formData.financials}
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
                            required
                            error={getError('grantRecipient')}
                        >
                            <input
                                type="text"
                                id="grantRecipient"
                                value={formData.grantRecipient}
                                onChange={(e) => updateField('grantRecipient', e.target.value)}
                                placeholder="Nazwa beneficjenta..."
                            />
                        </FormField>

                        <FormField
                            label="Podstawa prawna udzielenia dotacji"
                            htmlFor="grantLegalBasis"
                            required
                            error={getError('grantLegalBasis')}
                        >
                            <input
                                type="text"
                                id="grantLegalBasis"
                                value={formData.grantLegalBasis}
                                onChange={(e) => updateField('grantLegalBasis', e.target.value)}
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
                            value={formData.comments}
                            onChange={(e) => updateField('comments', e.target.value)}
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
