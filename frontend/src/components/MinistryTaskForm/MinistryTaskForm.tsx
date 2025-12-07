import React, { useState, useEffect } from 'react';
import { FormField } from '../FormField';
import { ComboBox } from '../ComboBox';
import './MinistryTaskForm.css';
import {
    parts,
    sections,
    chapters,
    paragraphs,
    departments,
    financingSources,
    taskBudgets
} from '../../data/dictionaries';

// Filter field configuration
const filterFields = [
    { key: 'czesc', label: 'Część budżetowa', data: parts },
    { key: 'dzial', label: 'Dział', data: sections },
    { key: 'rozdzial', label: 'Rozdział', data: chapters },
    { key: 'paragraf', label: 'Paragraf', data: paragraphs },
    { key: 'zrodloFinansowania', label: 'Źródło finansowania', data: financingSources },
    {
        key: 'grupaWydatkow', label: 'Grupa wydatków', data: [
            { code: 'biezace', name: 'Wydatki bieżące' },
            { code: 'majatkowe', name: 'Wydatki majątkowe' },
            { code: 'dlug', name: 'Wydatki na obsługę długu' }
        ]
    },
    { key: 'budzetZadaniowy', label: 'Budżet zadaniowy', data: taskBudgets },
    { key: 'komorka', label: 'Komórka organizacyjna', data: departments }
] as const;

type FilterKey = typeof filterFields[number]['key'];

interface FilterValues {
    czesc: string;
    dzial: string;
    rozdzial: string;
    paragraf: string;
    zrodloFinansowania: string;
    grupaWydatkow: string;
    budzetZadaniowy: string;
    komorka: string;
}

interface TaskRow extends FilterValues {
    id: number;
    rokBudzetu: string;
    kwota: string;
    terminWykonania: string;
}

interface SavedTask {
    id: number;
    termin_do: string;
    rok_budzetu: number;
    kwota: number;
    komorka_organizacyjna: string | null;
    dzial: string | null;
    rozdzial: string | null;
    paragraf: string | null;
    czesc_budzetowa: string | null;
    zrodlo_finansowania: string | null;
    grupa_wydatkow: string | null;
    budzet_zadaniowy: string | null;
}

export const MinistryTaskForm: React.FC = () => {
    const [showSuccess, setShowSuccess] = useState(false);
    const [filters, setFilters] = useState<FilterValues>({
        czesc: '',
        dzial: '',
        rozdzial: '',
        paragraf: '',
        zrodloFinansowania: '',
        grupaWydatkow: '',
        budzetZadaniowy: '',
        komorka: ''
    });
    const [rokBudzetu, setRokBudzetu] = useState('2025');
    const [kwota, setKwota] = useState('');
    const [terminWykonania, setTerminWykonania] = useState('');

    // New tasks (drafts)
    const [tasks, setTasks] = useState<TaskRow[]>([]);
    // Saved tasks (from API)
    const [savedTasks, setSavedTasks] = useState<SavedTask[]>([]);

    const [errors, setErrors] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [loadingSaved, setLoadingSaved] = useState(false);

    // Fetch saved tasks on mount
    useEffect(() => {
        fetchSavedTasks();
    }, []);

    const fetchSavedTasks = async () => {
        setLoadingSaved(true);
        try {
            const response = await fetch('/api/zadanie-ministerstwo');
            const result = await response.json();
            if (result.success) {
                setSavedTasks(result.data);
            }
        } catch (error) {
            console.error('Error fetching saved tasks:', error);
        } finally {
            setLoadingSaved(false);
        }
    };

    // Helper to get columns active across both drafts and saved tasks
    const usedColumns = React.useMemo(() => {
        const columns = new Set<FilterKey>();

        // Check drafts
        tasks.forEach(task => {
            filterFields.forEach(field => {
                if (task[field.key]) columns.add(field.key);
            });
        });

        // Check saved tasks
        savedTasks.forEach(task => {
            if (task.komorka_organizacyjna) columns.add('komorka');
            if (task.dzial) columns.add('dzial');
            if (task.rozdzial) columns.add('rozdzial');
            if (task.paragraf) columns.add('paragraf');
            if (task.czesc_budzetowa) columns.add('czesc');
            if (task.zrodlo_finansowania) columns.add('zrodloFinansowania');
            if (task.grupa_wydatkow) columns.add('grupaWydatkow');
            if (task.budzet_zadaniowy) columns.add('budzetZadaniowy');
        });

        // Also add currently selected filters in form
        filterFields.forEach(field => {
            if (filters[field.key]) {
                columns.add(field.key);
            }
        });
        return columns;
    }, [tasks, filters, savedTasks]);

    const updateFilter = (key: FilterKey, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const formatCurrency = (value: string): string => {
        const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
        const parts = cleaned.split('.');
        if (parts.length > 2) {
            return parts[0] + '.' + parts.slice(1).join('');
        }
        if (parts.length === 2 && parts[1].length > 2) {
            return parts[0] + '.' + parts[1].substring(0, 2);
        }
        return cleaned;
    };

    const handleKwotaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setKwota(formatCurrency(e.target.value));
    };

    const validateTask = (): string[] => {
        const newErrors: string[] = [];

        // Check at least one filter is selected
        const hasFilter = Object.values(filters).some(v => v.trim() !== '');
        if (!hasFilter) {
            newErrors.push('Wybierz przynajmniej jeden filtr');
        }

        if (!rokBudzetu) {
            newErrors.push('Rok budżetu jest wymagany');
        }

        if (!kwota || parseFloat(kwota) <= 0) {
            newErrors.push('Kwota musi być większa od zera');
        }

        if (!terminWykonania) {
            newErrors.push('Termin wykonania jest wymagany');
        }

        return newErrors;
    };

    const handleAddTask = () => {
        const validationErrors = validateTask();
        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }

        const newTask: TaskRow = {
            id: Date.now(),
            ...filters,
            rokBudzetu,
            kwota,
            terminWykonania
        };

        setTasks(prev => [...prev, newTask]);
        setErrors([]);

        // Reset filters but keep budget year and deadline
        setFilters({
            czesc: '',
            dzial: '',
            rozdzial: '',
            paragraf: '',
            zrodloFinansowania: '',
            grupaWydatkow: '',
            budzetZadaniowy: '',
            komorka: ''
        });
        setKwota('');
    };

    const handleRemoveTask = (id: number) => {
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    const handleSubmitAll = async () => {
        if (tasks.length === 0) {
            setErrors(['Dodaj przynajmniej jedno zadanie do listy roboczej']);
            return;
        }

        setSaving(true);
        try {
            for (const task of tasks) {
                const response = await fetch('/api/zadanie-ministerstwo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        czesc: task.czesc || null,
                        dzial: task.dzial || null,
                        rozdzial: task.rozdzial || null,
                        paragraf: task.paragraf || null,
                        zrodloFinansowania: task.zrodloFinansowania || null,
                        grupaWydatkow: task.grupaWydatkow || null,
                        budzetZadaniowy: task.budzetZadaniowy || null,
                        komorka: task.komorka || null,
                        rokBudzetu: parseInt(task.rokBudzetu),
                        kwota: parseFloat(task.kwota),
                        terminWykonania: task.terminWykonania
                    })
                });

                if (!response.ok) {
                    const result = await response.json();
                    throw new Error(result.error || 'Błąd zapisywania');
                }
            }

            setShowSuccess(true);
            setTasks([]);
            fetchSavedTasks(); // Refresh the list
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            setErrors([error instanceof Error ? error.message : 'Błąd połączenia z serwerem']);
        } finally {
            setSaving(false);
        }
    };

    const formatOptions = (items: { code: string; name: string }[]) =>
        items.map(item => ({
            code: item.code,
            name: `${item.code} - ${item.name}`
        }));

    const getDisplayValue = (key: FilterKey, value: string | null | undefined): string => {
        if (!value) return '-';
        const field = filterFields.find(f => f.key === key);
        if (!field) return value;
        const item = (field.data as any[]).find((d: { code: string }) => d.code === value);
        return item ? `${item.code}` : value;
    };

    // Helper to map SavedTask to display columns
    const getSavedValue = (task: SavedTask, key: FilterKey): string => {
        const map: Record<FilterKey, string | null> = {
            czesc: task.czesc_budzetowa,
            dzial: task.dzial,
            rozdzial: task.rozdzial,
            paragraf: task.paragraf,
            zrodloFinansowania: task.zrodlo_finansowania,
            grupaWydatkow: task.grupa_wydatkow,
            budzetZadaniowy: task.budzet_zadaniowy,
            komorka: task.komorka_organizacyjna
        };
        return getDisplayValue(key, map[key]);
    };

    return (
        <div className="ministry-task-form">
            {showSuccess && (
                <div className="ministry-task-form__success">
                    ✓ Wszystkie zadania zapisane pomyślnie!
                </div>
            )}

            <section className="ministry-task-form__section">
                <h2 className="ministry-task-form__section-title">
                    <span className="ministry-task-form__section-icon">🏛️</span>
                    Zadania od Ministerstwa - Definiowanie ograniczeń
                </h2>

                {/* Filter Grid */}
                <div className="ministry-task-form__filters">
                    <h3 className="ministry-task-form__subtitle">Filtry (wybierz co najmniej jeden)</h3>
                    <div className="ministry-task-form__grid ministry-task-form__grid--4">
                        {filterFields.map(field => (
                            <ComboBox
                                key={field.key}
                                label={field.label}
                                value={filters[field.key]}
                                onChange={(val) => updateFilter(field.key, val)}
                                options={formatOptions(field.data as { code: string; name: string }[])}
                                placeholder={`Wybierz ${field.label.toLowerCase()}...`}
                            />
                        ))}
                    </div>
                </div>

                {/* Budget Fields */}
                <div className="ministry-task-form__budget">
                    <h3 className="ministry-task-form__subtitle">Dane budżetowe</h3>
                    <div className="ministry-task-form__grid ministry-task-form__grid--3">
                        <FormField label="Rok budżetu" htmlFor="rokBudzetu" required>
                            <input
                                type="number"
                                id="rokBudzetu"
                                value={rokBudzetu}
                                onChange={(e) => setRokBudzetu(e.target.value)}
                                placeholder="np. 2025"
                                min="2020"
                                max="2100"
                                className="ministry-task-form__input"
                            />
                        </FormField>

                        <FormField label="Kwota" htmlFor="kwota" required>
                            <div className="ministry-task-form__currency-wrapper">
                                <input
                                    type="text"
                                    id="kwota"
                                    value={kwota}
                                    onChange={handleKwotaChange}
                                    placeholder="0.00"
                                    className="ministry-task-form__input ministry-task-form__input--currency"
                                    inputMode="decimal"
                                />
                                <span className="ministry-task-form__currency-label">zł</span>
                            </div>
                        </FormField>

                        <FormField label="Termin wykonania" htmlFor="terminWykonania" required>
                            <input
                                type="date"
                                id="terminWykonania"
                                value={terminWykonania}
                                onChange={(e) => setTerminWykonania(e.target.value)}
                                className="ministry-task-form__input"
                            />
                        </FormField>
                    </div>
                </div>

                {/* Add Button */}
                <div className="ministry-task-form__add-action">
                    <button
                        type="button"
                        className="ministry-task-form__btn ministry-task-form__btn--add"
                        onClick={handleAddTask}
                    >
                        + Dodaj ograniczenie
                    </button>
                </div>
            </section>

            {/* Errors */}
            {errors.length > 0 && (
                <div className="ministry-task-form__errors">
                    <h3>Błędy</h3>
                    <ul>
                        {errors.map((err, idx) => (
                            <li key={idx}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* DRAFT Tasks Table */}
            {tasks.length > 0 && (
                <section className="ministry-task-form__section">
                    <h2 className="ministry-task-form__section-title">
                        <span className="ministry-task-form__section-icon">📝</span>
                        Lista robocza ({tasks.length})
                    </h2>
                    <div className="ministry-task-form__table-container">
                        <table className="ministry-task-form__table">
                            <thead>
                                <tr>
                                    <th>Lp.</th>
                                    {filterFields.filter(f => usedColumns.has(f.key)).map(field => (
                                        <th key={field.key}>{field.label}</th>
                                    ))}
                                    <th>Rok</th>
                                    <th>Kwota</th>
                                    <th>Termin</th>
                                    <th>Akcje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map((task, index) => (
                                    <tr key={task.id}>
                                        <td>{index + 1}</td>
                                        {filterFields.filter(f => usedColumns.has(f.key)).map(field => (
                                            <td key={field.key}>
                                                {getDisplayValue(field.key, task[field.key])}
                                            </td>
                                        ))}
                                        <td>{task.rokBudzetu}</td>
                                        <td className="ministry-task-form__currency-cell">
                                            {parseFloat(task.kwota).toLocaleString('pl-PL', {
                                                style: 'currency',
                                                currency: 'PLN'
                                            })}
                                        </td>
                                        <td>{task.terminWykonania}</td>
                                        <td>
                                            <button
                                                type="button"
                                                className="ministry-task-form__btn ministry-task-form__btn--remove"
                                                onClick={() => handleRemoveTask(task.id)}
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="ministry-task-form__actions">
                        <button
                            type="button"
                            className="ministry-task-form__btn ministry-task-form__btn--secondary"
                            onClick={() => setTasks([])}
                        >
                            Wyczyść wszystko
                        </button>
                        <button
                            type="button"
                            className="ministry-task-form__btn ministry-task-form__btn--primary"
                            onClick={handleSubmitAll}
                            disabled={saving}
                        >
                            {saving ? 'Zapisywanie...' : 'Zapisz wszystkie zadania'}
                        </button>
                    </div>
                </section>
            )}

            {/* SAVED Tasks Table */}
            <section className="ministry-task-form__section">
                <h2 className="ministry-task-form__section-title">
                    <span className="ministry-task-form__section-icon">📋</span>
                    Dodane ograniczenia (Baza danych) {loadingSaved && '(Odświeżanie...)'}
                </h2>
                {savedTasks.length === 0 ? (
                    <p style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>Brak zapisanych zadań.</p>
                ) : (
                    <div className="ministry-task-form__table-container">
                        <table className="ministry-task-form__table ministry-task-form__table--saved">
                            <thead>
                                <tr>
                                    <th>Lp.</th>
                                    {filterFields.filter(f => usedColumns.has(f.key)).map(field => (
                                        <th key={field.key}>{field.label}</th>
                                    ))}
                                    <th>Rok</th>
                                    <th>Kwota</th>
                                    <th>Termin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {savedTasks.map((task, index) => (
                                    <tr key={task.id}>
                                        <td>{index + 1}</td>
                                        {filterFields.filter(f => usedColumns.has(f.key)).map(field => (
                                            <td key={field.key}>
                                                {getSavedValue(task, field.key)}
                                            </td>
                                        ))}
                                        <td>{task.rok_budzetu}</td>
                                        <td className="ministry-task-form__currency-cell">
                                            {task.kwota?.toLocaleString('pl-PL', {
                                                style: 'currency',
                                                currency: 'PLN'
                                            }) || '-'}
                                        </td>
                                        <td>{new Date(task.termin_do).toLocaleDateString('pl-PL')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
};
