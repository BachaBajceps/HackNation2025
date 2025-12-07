import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface BudgetPosition {
    id: number;
    czesc: string;
    dzial: string;
    rozdzial: string;
    paragraf: string;
    zrodloFinansowania: string;
    grupaWydatkow: string;
    nazwaProjektu: string;
    komorkaOrganizacyjna: string;
    nazwaZadania: string;
    potrzeby2026: number | null;
    limit2026: number | null;
    roznica2026: number | null;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface DepartmentDashboardProps { }

export const DepartmentDashboard: React.FC<DepartmentDashboardProps> = () => {
    const { departmentName } = useAuth();
    const [budgetPositions, setBudgetPositions] = useState<BudgetPosition[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchBudgetPositions = async () => {
        setLoading(true);
        try {
            const komorka = departmentName || '';
            const response = await fetch(`/api/budzet/zestawienie?komorka=${encodeURIComponent(komorka)}`);
            const result = await response.json();
            if (result.success) {
                setBudgetPositions(result.data || []);
            }
        } catch (err) {
            console.error('Error fetching budget positions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBudgetPositions();
    }, [departmentName]);

    const formatCurrency = (value: number | null) => {
        if (value === null || value === undefined) return '-';
        return value.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' });
    };

    return (
        <div className="department-dashboard">
            <header className="dashboard-header">
                <h2>Panel Departamentu: {departmentName}</h2>
                <div className="header-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={fetchBudgetPositions}
                        disabled={loading}
                    >
                        Odśwież
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="loading">Ładowanie...</div>
            ) : (
                <div className="table-container">
                    <h3>Zestawienie pozycji budżetowych</h3>
                    <table className="forms-table">
                        <thead>
                            <tr>
                                <th>Lp.</th>
                                <th>Część</th>
                                <th>Dział</th>
                                <th>Rozdział</th>
                                <th>Paragraf</th>
                                <th>Źródło</th>
                                <th>Grupa wydatków</th>
                                <th>Nazwa zadania</th>
                                <th>Potrzeby 2026</th>
                                <th>Limit 2026</th>
                                <th>Różnica</th>
                            </tr>
                        </thead>
                        <tbody>
                            {budgetPositions.length === 0 ? (
                                <tr><td colSpan={11} style={{ textAlign: 'center' }}>Brak formularzy dla tego departamentu</td></tr>
                            ) : (
                                budgetPositions.map((pos, index) => (
                                    <tr key={pos.id}>
                                        <td>{index + 1}</td>
                                        <td>{pos.czesc}</td>
                                        <td>{pos.dzial}</td>
                                        <td>{pos.rozdzial}</td>
                                        <td>{pos.paragraf}</td>
                                        <td>{pos.zrodloFinansowania}</td>
                                        <td>{pos.grupaWydatkow}</td>
                                        <td>{pos.nazwaZadania || pos.nazwaProjektu || '-'}</td>
                                        <td className="currency">{formatCurrency(pos.potrzeby2026)}</td>
                                        <td className="currency">{formatCurrency(pos.limit2026)}</td>
                                        <td className="currency">{formatCurrency(pos.roznica2026)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <style>{`
                .department-dashboard {
                    padding: 20px;
                    max-width: 1400px;
                    margin: 0 auto;
                }
                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #eee;
                }
                .dashboard-header h2 {
                    margin: 0;
                    color: var(--color-text-primary, #333);
                }
                .table-container h3 {
                    margin-top: 0;
                    margin-bottom: 15px;
                    font-size: 1.2rem;
                    color: var(--color-text-secondary, #666);
                }
                .forms-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: var(--color-surface, white);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    border-radius: 8px;
                    overflow: hidden;
                }
                .forms-table th, .forms-table td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid var(--color-border, #eee);
                    color: var(--color-text-primary, #333);
                }
                .forms-table th {
                    background-color: var(--color-surface-alt, #f8f9fa);
                    font-weight: 600;
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .forms-table tbody tr:hover {
                    background-color: var(--color-surface-hover, #f1f5f9);
                }
                .currency {
                    text-align: right;
                    font-family: 'Roboto Mono', monospace;
                    font-weight: 500;
                }
                .btn {
                    padding: 8px 16px;
                    border-radius: 6px;
                    border: 1px solid var(--color-border, #ccc);
                    cursor: pointer;
                    font-weight: 500;
                    background: var(--color-surface, white);
                    color: var(--color-text-primary, #333);
                    transition: all 0.2s;
                }
                .btn:hover {
                    background: var(--color-surface-hover, #f1f5f9);
                }
                .loading {
                    text-align: center;
                    padding: 40px;
                    color: var(--color-text-secondary, #666);
                }

                /* Dark mode support via CSS variables */
                @media (prefers-color-scheme: dark) {
                    .dashboard-header {
                        border-bottom-color: rgba(255,255,255,0.1);
                    }
                }
            `}</style>
        </div>
    );
};
