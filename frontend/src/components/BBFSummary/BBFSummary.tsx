import React, { useState, useEffect, useMemo } from 'react';
import { departments } from '../../data/dictionaries';
import './BBFSummary.css';

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
    // Year 2026
    potrzeby2026: number | null;
    limit2026: number | null;
    roznica2026: number | null;
    kwotaUmowy2026: number | null;
    nrUmowy2026: string;
    // Year 2027
    potrzeby2027: number | null;
    limit2027: number | null;
    roznica2027: number | null;
    kwotaUmowy2027: number | null;
    nrUmowy2027: string;
    // Year 2028
    potrzeby2028: number | null;
    limit2028: number | null;
    roznica2028: number | null;
    kwotaUmowy2028: number | null;
    nrUmowy2028: string;
    // Year 2029
    potrzeby2029: number | null;
    limit2029: number | null;
    roznica2029: number | null;
    kwotaUmowy2029: number | null;
    nrUmowy2029: string;
    // Dotacja
    beneficjentDotacji: string;
    podstawaPrawnaDotacji: string;
    uwagi: string;
}

export const BBFSummary: React.FC = () => {
    const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
    const [data, setData] = useState<BudgetRow[]>([]);
    const [loading, setLoading] = useState(false);

    // Sort departments alphabetically
    const sortedDepartments = useMemo(() =>
        [...departments].sort((a, b) => a.name.localeCompare(b.name, 'pl')),
        []
    );

    // Fetch data from API
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const url = selectedDepartment === 'all'
                    ? '/api/budzet/zestawienie'
                    : `/api/budzet/zestawienie?komorka=${encodeURIComponent(selectedDepartment)}`;
                const response = await fetch(url);
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
    }, [selectedDepartment]);

    // Filter data by selected department
    const filteredData = useMemo(() => {
        if (selectedDepartment === 'all') return data;
        return data.filter(row => row.komorkaOrganizacyjna === selectedDepartment);
    }, [data, selectedDepartment]);

    // Group data by department for "all" view
    const groupedData = useMemo(() => {
        if (selectedDepartment !== 'all') return null;
        const groups: { [key: string]: BudgetRow[] } = {};
        data.forEach(row => {
            const key = row.komorkaOrganizacyjna || 'Nieprzypisane';
            if (!groups[key]) groups[key] = [];
            groups[key].push(row);
        });
        return groups;
    }, [data, selectedDepartment]);

    const formatCurrency = (value: number | null) => {
        if (value === null || value === undefined) return '-';
        return value.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 2 });
    };

    const renderTable = (rows: BudgetRow[], title?: string) => (
        <div className="bbf-summary__table-container">
            {title && <h3 className="bbf-summary__group-title">{title}</h3>}
            <div className="bbf-summary__table-scroll">
                <table className="bbf-summary__table">
                    <thead>
                        <tr>
                            <th>Lp.</th>
                            <th>Część budżetowa</th>
                            <th>Dział</th>
                            <th>Rozdział</th>
                            <th>Paragraf</th>
                            <th>Źródło finansowania</th>
                            <th>Grupa wydatków</th>
                            <th>Budżet zadaniowy (pełny)</th>
                            <th>Budżet zadaniowy (funkcja/zadanie)</th>
                            <th>Nazwa programu/projektu</th>
                            <th>Komórka organizacyjna</th>
                            <th>Plan WI</th>
                            <th>Dysponent środków</th>
                            <th>Budżet</th>
                            <th>Nazwa zadania</th>
                            <th>Uzasadnienie realizacji zadania</th>
                            <th>Przeznaczenie wydatków</th>
                            {/* 2026 */}
                            <th>Potrzeby 2026</th>
                            <th>Limit 2026</th>
                            <th>Kwota niezabezpieczona 2026</th>
                            <th>Kwota umowy 2026</th>
                            <th>Nr umowy 2026</th>
                            {/* 2027 */}
                            <th>Potrzeby 2027</th>
                            <th>Limit 2027</th>
                            <th>Kwota niezabezpieczona 2027</th>
                            <th>Kwota umowy 2027</th>
                            <th>Nr umowy 2027</th>
                            {/* 2028 */}
                            <th>Potrzeby 2028</th>
                            <th>Limit 2028</th>
                            <th>Kwota niezabezpieczona 2028</th>
                            <th>Kwota umowy 2028</th>
                            <th>Nr umowy 2028</th>
                            {/* 2029 */}
                            <th>Potrzeby 2029</th>
                            <th>Limit 2029</th>
                            <th>Kwota niezabezpieczona 2029</th>
                            <th>Kwota umowy 2029</th>
                            <th>Nr umowy 2029</th>
                            {/* Dotacja */}
                            <th>Beneficjent dotacji</th>
                            <th>Podstawa prawna dotacji</th>
                            <th>Uwagi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={40} className="bbf-summary__empty">
                                    Brak danych do wyświetlenia
                                </td>
                            </tr>
                        ) : (
                            rows.map((row, index) => (
                                <tr key={row.id || index}>
                                    <td>{index + 1}</td>
                                    <td>{row.czesc}</td>
                                    <td>{row.dzial}</td>
                                    <td>{row.rozdzial}</td>
                                    <td>{row.paragraf}</td>
                                    <td>{row.zrodloFinansowania}</td>
                                    <td>{row.grupaWydatkow}</td>
                                    <td>{row.budzetZadaniowyPelny}</td>
                                    <td>{row.budzetZadaniowySkrocony}</td>
                                    <td>{row.nazwaProjektu}</td>
                                    <td>{row.komorkaOrganizacyjna}</td>
                                    <td>{row.planWI}</td>
                                    <td>{row.dysponent}</td>
                                    <td>{row.kodBudzetu}</td>
                                    <td>{row.nazwaZadania}</td>
                                    <td>{row.uzasadnienie}</td>
                                    <td>{row.przeznaczenie}</td>
                                    {/* 2026 */}
                                    <td className="bbf-summary__currency">{formatCurrency(row.potrzeby2026)}</td>
                                    <td className="bbf-summary__currency">{formatCurrency(row.limit2026)}</td>
                                    <td className="bbf-summary__currency">{formatCurrency(row.roznica2026)}</td>
                                    <td className="bbf-summary__currency">{formatCurrency(row.kwotaUmowy2026)}</td>
                                    <td>{row.nrUmowy2026}</td>
                                    {/* 2027 */}
                                    <td className="bbf-summary__currency">{formatCurrency(row.potrzeby2027)}</td>
                                    <td className="bbf-summary__currency">{formatCurrency(row.limit2027)}</td>
                                    <td className="bbf-summary__currency">{formatCurrency(row.roznica2027)}</td>
                                    <td className="bbf-summary__currency">{formatCurrency(row.kwotaUmowy2027)}</td>
                                    <td>{row.nrUmowy2027}</td>
                                    {/* 2028 */}
                                    <td className="bbf-summary__currency">{formatCurrency(row.potrzeby2028)}</td>
                                    <td className="bbf-summary__currency">{formatCurrency(row.limit2028)}</td>
                                    <td className="bbf-summary__currency">{formatCurrency(row.roznica2028)}</td>
                                    <td className="bbf-summary__currency">{formatCurrency(row.kwotaUmowy2028)}</td>
                                    <td>{row.nrUmowy2028}</td>
                                    {/* 2029 */}
                                    <td className="bbf-summary__currency">{formatCurrency(row.potrzeby2029)}</td>
                                    <td className="bbf-summary__currency">{formatCurrency(row.limit2029)}</td>
                                    <td className="bbf-summary__currency">{formatCurrency(row.roznica2029)}</td>
                                    <td className="bbf-summary__currency">{formatCurrency(row.kwotaUmowy2029)}</td>
                                    <td>{row.nrUmowy2029}</td>
                                    {/* Dotacja */}
                                    <td>{row.beneficjentDotacji}</td>
                                    <td>{row.podstawaPrawnaDotacji}</td>
                                    <td>{row.uwagi}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="bbf-summary">
            {/* Left sidebar - Department selector */}
            <aside className="bbf-summary__sidebar">
                <h2 className="bbf-summary__sidebar-title">
                    <span className="bbf-summary__sidebar-icon">🏢</span>
                    Komórki organizacyjne
                </h2>
                <ul className="bbf-summary__department-list">
                    <li
                        className={`bbf-summary__department-item ${selectedDepartment === 'all' ? 'bbf-summary__department-item--active' : ''}`}
                        onClick={() => setSelectedDepartment('all')}
                    >
                        <span className="bbf-summary__department-icon">📋</span>
                        Zestawienie wszystkich komórek
                    </li>
                    {sortedDepartments.map(dept => (
                        <li
                            key={dept.code}
                            className={`bbf-summary__department-item ${selectedDepartment === dept.code ? 'bbf-summary__department-item--active' : ''}`}
                            onClick={() => setSelectedDepartment(dept.code)}
                        >
                            <span className="bbf-summary__department-icon">🏛️</span>
                            {dept.name}
                        </li>
                    ))}
                </ul>
            </aside>

            {/* Main content - Data table */}
            <main className="bbf-summary__content">
                <header className="bbf-summary__header">
                    <h1 className="bbf-summary__title">
                        <span className="bbf-summary__title-icon">📊</span>
                        Biuro Budżetowo-Finansowe
                    </h1>
                    <p className="bbf-summary__subtitle">
                        {selectedDepartment === 'all'
                            ? 'Zestawienie danych ze wszystkich komórek organizacyjnych'
                            : `Zestawienie danych: ${sortedDepartments.find(d => d.code === selectedDepartment)?.name || selectedDepartment}`
                        }
                    </p>
                </header>

                {loading ? (
                    <div className="bbf-summary__loading">
                        <div className="bbf-summary__spinner"></div>
                        <p>Ładowanie danych...</p>
                    </div>
                ) : (
                    <div className="bbf-summary__data">
                        {selectedDepartment === 'all' && groupedData ? (
                            Object.entries(groupedData)
                                .sort(([a], [b]) => a.localeCompare(b, 'pl'))
                                .map(([deptName, rows]) => renderTable(rows, deptName))
                        ) : (
                            renderTable(filteredData)
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};
