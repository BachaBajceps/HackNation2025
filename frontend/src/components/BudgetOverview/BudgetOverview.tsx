import React, { useState, useEffect, useMemo } from 'react';
import './BudgetOverview.css';

interface BudgetRow {
    id: number;
    czesc: string;
    dzial: string;
    rozdzial: string;
    paragraf: string;
    zrodloFinansowania: string;
    grupaWydatkow: string;
    budzetZadaniowyPelny: string;
    budzetZadaniowySkrocony: string;
    nazwaProjektu: string;
    komorkaOrganizacyjna: string;
    planWI: string;
    dysponent: string;
    kodBudzetu: string;
    nazwaZadania: string;
    uzasadnienie: string;
    przeznaczenie: string;
    potrzeby2026: number | null;
    limit2026: number | null;
    roznica2026: number | null;
    kwotaUmowy2026: number | null;
    nrUmowy2026: string;
    potrzeby2027: number | null;
    limit2027: number | null;
    roznica2027: number | null;
    kwotaUmowy2027: number | null;
    nrUmowy2027: string;
    potrzeby2028: number | null;
    limit2028: number | null;
    roznica2028: number | null;
    kwotaUmowy2028: number | null;
    nrUmowy2028: string;
    potrzeby2029: number | null;
    limit2029: number | null;
    roznica2029: number | null;
    kwotaUmowy2029: number | null;
    nrUmowy2029: string;
    beneficjentDotacji: string;
    podstawaPrawnaDotacji: string;
    uwagi: string;
}

type SortField = keyof BudgetRow;
type SortDirection = 'asc' | 'desc';

interface ColumnDef {
    key: string;
    label: string;
    sortable: boolean;
    currency?: boolean;
    filterable?: boolean;
}

const COLUMNS: ColumnDef[] = [
    { key: 'czesc', label: 'Część budżetowa', sortable: true, filterable: true },
    { key: 'dzial', label: 'Dział', sortable: true, filterable: true },
    { key: 'rozdzial', label: 'Rozdział', sortable: true, filterable: true },
    { key: 'paragraf', label: 'Paragraf', sortable: true, filterable: true },
    { key: 'zrodloFinansowania', label: 'Źródło finansowania', sortable: true, filterable: true },
    { key: 'grupaWydatkow', label: 'Grupa wydatków', sortable: true, filterable: true },
    { key: 'budzetZadaniowyPelny', label: 'Budżet zadaniowy (pełny)', sortable: true, filterable: true },
    { key: 'budzetZadaniowySkrocony', label: 'Budżet zadaniowy (funkcja/zadanie)', sortable: true, filterable: true },
    { key: 'nazwaProjektu', label: 'Nazwa programu/projektu', sortable: true, filterable: true },
    { key: 'komorkaOrganizacyjna', label: 'Nazwa komórki organizacyjnej', sortable: true, filterable: true },
    { key: 'planWI', label: 'Plan WI', sortable: true, filterable: true },
    { key: 'dysponent', label: 'Dysponent środków', sortable: true, filterable: true },
    { key: 'kodBudzetu', label: 'Budżet', sortable: true, filterable: true },
    { key: 'nazwaZadania', label: 'Nazwa zadania', sortable: false, filterable: true },
    { key: 'uzasadnienie', label: 'Szczegółowe uzasadnienie realizacji zadania', sortable: false, filterable: true },
    { key: 'przeznaczenie', label: 'Przeznaczenie wydatków', sortable: false, filterable: true },
    { key: 'potrzeby2026', label: 'Potrzeby 2026', sortable: false, currency: true },
    { key: 'limit2026', label: 'Limit 2026', sortable: false, currency: true },
    { key: 'roznica2026', label: 'Kwota niezabezpieczona 2026', sortable: false, currency: true },
    { key: 'kwotaUmowy2026', label: 'Kwota umowy 2026', sortable: false, currency: true },
    { key: 'nrUmowy2026', label: 'Nr umowy 2026', sortable: false },
    { key: 'potrzeby2027', label: 'Potrzeby 2027', sortable: false, currency: true },
    { key: 'limit2027', label: 'Limit 2027', sortable: false, currency: true },
    { key: 'roznica2027', label: 'Kwota niezabezpieczona 2027', sortable: false, currency: true },
    { key: 'kwotaUmowy2027', label: 'Kwota umowy 2027', sortable: false, currency: true },
    { key: 'nrUmowy2027', label: 'Nr umowy 2027', sortable: false },
    { key: 'potrzeby2028', label: 'Potrzeby 2028', sortable: false, currency: true },
    { key: 'limit2028', label: 'Limit 2028', sortable: false, currency: true },
    { key: 'roznica2028', label: 'Kwota niezabezpieczona 2028', sortable: false, currency: true },
    { key: 'kwotaUmowy2028', label: 'Kwota umowy 2028', sortable: false, currency: true },
    { key: 'nrUmowy2028', label: 'Nr umowy 2028', sortable: false },
    { key: 'potrzeby2029', label: 'Potrzeby 2029', sortable: false, currency: true },
    { key: 'limit2029', label: 'Limit 2029', sortable: false, currency: true },
    { key: 'roznica2029', label: 'Kwota niezabezpieczona 2029', sortable: false, currency: true },
    { key: 'kwotaUmowy2029', label: 'Kwota umowy 2029', sortable: false, currency: true },
    { key: 'nrUmowy2029', label: 'Nr umowy 2029', sortable: false },
    { key: 'beneficjentDotacji', label: 'Beneficjent dotacji', sortable: false },
    { key: 'podstawaPrawnaDotacji', label: 'Podstawa prawna dotacji', sortable: false },
    { key: 'uwagi', label: 'Uwagi', sortable: false },
];

export const BudgetOverview: React.FC = () => {
    const [data, setData] = useState<BudgetRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/budzet/zestawienie');
                const result = await response.json();
                if (result.success) {
                    setData(result.data || []);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter data
    const filteredData = useMemo(() => {
        return data.filter(row => {
            return Object.entries(filters).every(([key, filterValue]) => {
                if (!filterValue.trim()) return true;
                const cellValue = row[key as keyof BudgetRow];
                if (cellValue === null || cellValue === undefined) return false;
                return String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
            });
        });
    }, [data, filters]);

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortField) return filteredData;
        return [...filteredData].sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;
            const comparison = String(aVal).localeCompare(String(bVal), 'pl', { numeric: true });
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [filteredData, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({});
    };

    const activeFilterCount = Object.values(filters).filter(v => v.trim()).length;

    const formatCurrency = (value: number | null) => {
        if (value === null || value === undefined) return '-';
        return value.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 2 });
    };

    // Export to Excel (CSV format that Excel can open)
    const exportToExcel = () => {
        const headers = COLUMNS.map(c => c.label);
        const rows = sortedData.map(row =>
            COLUMNS.map(col => {
                const val = row[col.key as keyof BudgetRow];
                if (val === null || val === undefined) return '';
                if (col.currency) return val;
                return String(val).replace(/"/g, '""');
            })
        );

        const csvContent = [
            headers.map(h => `"${h}"`).join(';'),
            ...rows.map(r => r.map(v => typeof v === 'number' ? v : `"${v}"`).join(';'))
        ].join('\n');

        // Add BOM for Excel UTF-8 support
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `zestawienie_budzetowe_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Stats (from filtered data)
    const totalPotrzeby2026 = filteredData.reduce((sum, r) => sum + (r.potrzeby2026 || 0), 0);
    const totalLimit2026 = filteredData.reduce((sum, r) => sum + (r.limit2026 || 0), 0);
    const departmentCount = new Set(filteredData.map(r => r.komorkaOrganizacyjna)).size;

    return (
        <div className="budget-overview">
            <header className="budget-overview__header">
                <div>
                    <h2 className="budget-overview__title">
                        <span>📊</span> Przegląd Budżetu
                    </h2>
                    <p className="budget-overview__subtitle">
                        Zestawienie danych ze wszystkich komórek organizacyjnych
                    </p>
                </div>
            </header>

            {loading ? (
                <div className="budget-overview__loading">
                    <div className="budget-overview__spinner"></div>
                    <p>Ładowanie danych...</p>
                </div>
            ) : (
                <>
                    {/* Stats and actions */}
                    <div className="budget-overview__actions">
                        <div className="budget-overview__stats">
                            <div className="budget-overview__stat">
                                <span className="budget-overview__stat-icon">🏢</span>
                                <span className="budget-overview__stat-value">{departmentCount}</span>
                                <span className="budget-overview__stat-label">Departamentów</span>
                            </div>
                            <div className="budget-overview__stat">
                                <span className="budget-overview__stat-icon">📝</span>
                                <span className="budget-overview__stat-value">{sortedData.length}</span>
                                <span className="budget-overview__stat-label">Wierszy</span>
                            </div>
                            <div className="budget-overview__stat">
                                <span className="budget-overview__stat-icon">💰</span>
                                <span className="budget-overview__stat-value">{formatCurrency(totalPotrzeby2026)}</span>
                                <span className="budget-overview__stat-label">Potrzeby 2026</span>
                            </div>
                            <div className="budget-overview__stat">
                                <span className="budget-overview__stat-icon">📈</span>
                                <span className="budget-overview__stat-value">{formatCurrency(totalLimit2026)}</span>
                                <span className="budget-overview__stat-label">Limit 2026</span>
                            </div>
                        </div>
                        <div className="budget-overview__buttons">
                            <button
                                className={`budget-overview__filter-toggle ${showFilters ? 'budget-overview__filter-toggle--active' : ''}`}
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                🔍 Filtry {activeFilterCount > 0 && `(${activeFilterCount})`}
                            </button>
                            {activeFilterCount > 0 && (
                                <button className="budget-overview__clear-filters" onClick={clearFilters}>
                                    ✕ Wyczyść filtry
                                </button>
                            )}
                            <button className="budget-overview__export-btn" onClick={exportToExcel}>
                                📥 Eksportuj do Excel
                            </button>
                        </div>
                    </div>

                    {/* Filter row */}
                    {showFilters && (
                        <div className="budget-overview__filters">
                            <h4>Filtruj dane:</h4>
                            <div className="budget-overview__filters-grid">
                                {COLUMNS.filter(col => col.filterable).map(col => (
                                    <div key={col.key} className="budget-overview__filter-item">
                                        <label>{col.label}</label>
                                        <input
                                            type="text"
                                            value={filters[col.key] || ''}
                                            onChange={e => handleFilterChange(col.key, e.target.value)}
                                            placeholder={`Szukaj...`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Data table */}
                    <div className="budget-overview__table-wrapper">
                        <div className="budget-overview__table-scroll">
                            <table className="budget-overview__table">
                                <thead>
                                    <tr>
                                        <th>Lp.</th>
                                        {COLUMNS.map(col => (
                                            <th
                                                key={col.key}
                                                className={col.sortable ? 'budget-overview__th--sortable' : ''}
                                                onClick={() => col.sortable && handleSort(col.key as SortField)}
                                            >
                                                {col.label}
                                                {col.sortable && sortField === col.key && (
                                                    <span className="budget-overview__sort-icon">
                                                        {sortDirection === 'asc' ? ' ▲' : ' ▼'}
                                                    </span>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={COLUMNS.length + 1} className="budget-overview__empty">
                                                Brak danych do wyświetlenia
                                            </td>
                                        </tr>
                                    ) : (
                                        sortedData.map((row, index) => (
                                            <tr key={row.id || index}>
                                                <td>{index + 1}</td>
                                                {COLUMNS.map(col => (
                                                    <td
                                                        key={col.key}
                                                        className={col.currency ? 'budget-overview__currency' : ''}
                                                    >
                                                        {col.currency
                                                            ? formatCurrency(row[col.key as keyof BudgetRow] as number | null)
                                                            : (row[col.key as keyof BudgetRow] || '-')
                                                        }
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
