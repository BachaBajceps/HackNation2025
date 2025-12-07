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
    potrzeby2027: number | null;
    limit2027: number | null;
    roznica2027: number | null;
    potrzeby2028: number | null;
    limit2028: number | null;
    roznica2028: number | null;
    potrzeby2029: number | null;
    limit2029: number | null;
    roznica2029: number | null;
    uwagi: string;
}

interface DepartmentSummary {
    name: string;
    rowCount: number;
    totalPotrzeby2026: number;
    totalLimit2026: number;
    totalPotrzeby2027: number;
    totalLimit2027: number;
}

export const BudgetOverview: React.FC = () => {
    const [data, setData] = useState<BudgetRow[]>([]);
    const [loading, setLoading] = useState(false);

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

    // Group and summarize by department
    const departmentSummaries = useMemo((): DepartmentSummary[] => {
        const groups: { [key: string]: BudgetRow[] } = {};
        data.forEach(row => {
            const key = row.komorkaOrganizacyjna || 'Nieprzypisane';
            if (!groups[key]) groups[key] = [];
            groups[key].push(row);
        });

        return Object.entries(groups)
            .map(([name, rows]) => ({
                name,
                rowCount: rows.length,
                totalPotrzeby2026: rows.reduce((sum, r) => sum + (r.potrzeby2026 || 0), 0),
                totalLimit2026: rows.reduce((sum, r) => sum + (r.limit2026 || 0), 0),
                totalPotrzeby2027: rows.reduce((sum, r) => sum + (r.potrzeby2027 || 0), 0),
                totalLimit2027: rows.reduce((sum, r) => sum + (r.limit2027 || 0), 0),
            }))
            .sort((a, b) => a.name.localeCompare(b.name, 'pl'));
    }, [data]);

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 2 });
    };

    const totalPotrzeby = departmentSummaries.reduce((sum, d) => sum + d.totalPotrzeby2026, 0);
    const totalLimit = departmentSummaries.reduce((sum, d) => sum + d.totalLimit2026, 0);

    return (
        <div className="budget-overview">
            <header className="budget-overview__header">
                <h2 className="budget-overview__title">
                    <span>📊</span> Przegląd Budżetu
                </h2>
                <p className="budget-overview__subtitle">
                    Zestawienie danych ze wszystkich komórek organizacyjnych
                </p>
            </header>

            {loading ? (
                <div className="budget-overview__loading">
                    <div className="budget-overview__spinner"></div>
                    <p>Ładowanie danych...</p>
                </div>
            ) : (
                <>
                    {/* Summary cards */}
                    <div className="budget-overview__summary-cards">
                        <div className="budget-overview__card">
                            <div className="budget-overview__card-icon">🏢</div>
                            <div className="budget-overview__card-content">
                                <span className="budget-overview__card-value">{departmentSummaries.length}</span>
                                <span className="budget-overview__card-label">Departamentów</span>
                            </div>
                        </div>
                        <div className="budget-overview__card">
                            <div className="budget-overview__card-icon">📝</div>
                            <div className="budget-overview__card-content">
                                <span className="budget-overview__card-value">{data.length}</span>
                                <span className="budget-overview__card-label">Wierszy budżetowych</span>
                            </div>
                        </div>
                        <div className="budget-overview__card">
                            <div className="budget-overview__card-icon">💰</div>
                            <div className="budget-overview__card-content">
                                <span className="budget-overview__card-value">{formatCurrency(totalPotrzeby)}</span>
                                <span className="budget-overview__card-label">Potrzeby 2026</span>
                            </div>
                        </div>
                        <div className="budget-overview__card">
                            <div className="budget-overview__card-icon">📈</div>
                            <div className="budget-overview__card-content">
                                <span className="budget-overview__card-value">{formatCurrency(totalLimit)}</span>
                                <span className="budget-overview__card-label">Limit 2026</span>
                            </div>
                        </div>
                    </div>

                    {/* Department table */}
                    <div className="budget-overview__table-container">
                        <table className="budget-overview__table">
                            <thead>
                                <tr>
                                    <th>Lp.</th>
                                    <th>Komórka organizacyjna</th>
                                    <th>Liczba wierszy</th>
                                    <th>Potrzeby 2026</th>
                                    <th>Limit 2026</th>
                                    <th>Potrzeby 2027</th>
                                    <th>Limit 2027</th>
                                </tr>
                            </thead>
                            <tbody>
                                {departmentSummaries.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="budget-overview__empty">
                                            Brak danych do wyświetlenia
                                        </td>
                                    </tr>
                                ) : (
                                    departmentSummaries.map((dept, index) => (
                                        <tr key={dept.name}>
                                            <td>{index + 1}</td>
                                            <td>{dept.name}</td>
                                            <td>{dept.rowCount}</td>
                                            <td className="budget-overview__currency">{formatCurrency(dept.totalPotrzeby2026)}</td>
                                            <td className="budget-overview__currency">{formatCurrency(dept.totalLimit2026)}</td>
                                            <td className="budget-overview__currency">{formatCurrency(dept.totalPotrzeby2027)}</td>
                                            <td className="budget-overview__currency">{formatCurrency(dept.totalLimit2027)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={2}><strong>RAZEM</strong></td>
                                    <td><strong>{data.length}</strong></td>
                                    <td className="budget-overview__currency"><strong>{formatCurrency(totalPotrzeby)}</strong></td>
                                    <td className="budget-overview__currency"><strong>{formatCurrency(totalLimit)}</strong></td>
                                    <td className="budget-overview__currency"><strong>{formatCurrency(departmentSummaries.reduce((s, d) => s + d.totalPotrzeby2027, 0))}</strong></td>
                                    <td className="budget-overview__currency"><strong>{formatCurrency(departmentSummaries.reduce((s, d) => s + d.totalLimit2027, 0))}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};
