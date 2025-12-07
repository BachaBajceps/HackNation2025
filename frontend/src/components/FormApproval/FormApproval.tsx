import React, { useState, useEffect, useMemo } from 'react';
import './FormApproval.css';

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
    potrzeby2028: number | null;
    limit2028: number | null;
    potrzeby2029: number | null;
    limit2029: number | null;
}

interface DepartmentStatus {
    status: 'pending' | 'approved' | 'rejected';
    komentarz: string;
}

export const FormApproval: React.FC = () => {
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [allData, setAllData] = useState<BudgetRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [departmentStatuses, setDepartmentStatuses] = useState<Record<string, DepartmentStatus>>({});
    const [comment, setComment] = useState('');

    // Extract unique departments from actual data
    const uniqueDepartments = useMemo(() => {
        const depts = new Set(allData.map(r => r.komorkaOrganizacyjna).filter(Boolean));
        return Array.from(depts).sort((a, b) => a.localeCompare(b, 'pl'));
    }, [allData]);

    // Fetch all data once
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/budzet/zestawienie');
                const result = await response.json();
                if (result.success) {
                    setAllData(result.data || []);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Set first department as default when data loads
    useEffect(() => {
        if (uniqueDepartments.length > 0 && !selectedDepartment) {
            setSelectedDepartment(uniqueDepartments[0]);
        }
    }, [uniqueDepartments, selectedDepartment]);

    // Filter data for selected department
    const filteredData = useMemo(() => {
        if (!selectedDepartment) return [];
        return allData.filter(row => row.komorkaOrganizacyjna === selectedDepartment);
    }, [allData, selectedDepartment]);

    // Calculate summary for selected department
    const summary = useMemo(() => {
        return {
            rowCount: filteredData.length,
            totalPotrzeby2026: filteredData.reduce((sum, r) => sum + (r.potrzeby2026 || 0), 0),
            totalLimit2026: filteredData.reduce((sum, r) => sum + (r.limit2026 || 0), 0),
            totalPotrzeby2027: filteredData.reduce((sum, r) => sum + (r.potrzeby2027 || 0), 0),
            totalLimit2027: filteredData.reduce((sum, r) => sum + (r.limit2027 || 0), 0),
        };
    }, [filteredData]);

    const currentStatus = departmentStatuses[selectedDepartment] || { status: 'pending', komentarz: '' };

    const handleApproveDepartment = () => {
        setDepartmentStatuses(prev => ({
            ...prev,
            [selectedDepartment]: { status: 'approved', komentarz: comment }
        }));
        setComment('');
    };

    const handleRejectDepartment = () => {
        if (!comment.trim()) {
            alert('Podaj powód odrzucenia formularzy departamentu');
            return;
        }
        setDepartmentStatuses(prev => ({
            ...prev,
            [selectedDepartment]: { status: 'rejected', komentarz: comment }
        }));
        setComment('');
    };

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 2 });
    };

    // Stats - only count departments that have data
    const globalStats = useMemo(() => {
        let pending = 0, approved = 0, rejected = 0;
        uniqueDepartments.forEach(deptName => {
            const status = departmentStatuses[deptName]?.status || 'pending';
            if (status === 'pending') pending++;
            else if (status === 'approved') approved++;
            else if (status === 'rejected') rejected++;
        });
        return { pending, approved, rejected };
    }, [departmentStatuses, uniqueDepartments]);

    return (
        <div className="form-approval">
            {/* Left sidebar */}
            <aside className="form-approval__sidebar">
                <h2 className="form-approval__sidebar-title">
                    <span>🏢</span> Departamenty
                </h2>
                {uniqueDepartments.length === 0 && !loading && (
                    <p className="form-approval__no-data">Brak danych</p>
                )}
                <ul className="form-approval__dept-list">
                    {uniqueDepartments.map(deptName => {
                        const count = allData.filter(r => r.komorkaOrganizacyjna === deptName).length;
                        const status = departmentStatuses[deptName]?.status || 'pending';
                        return (
                            <li
                                key={deptName}
                                className={`form-approval__dept-item form-approval__dept-item--${status} ${selectedDepartment === deptName ? 'form-approval__dept-item--active' : ''}`}
                                onClick={() => setSelectedDepartment(deptName)}
                            >
                                <span className="form-approval__dept-status-icon">
                                    {status === 'pending' && '⏳'}
                                    {status === 'approved' && '✓'}
                                    {status === 'rejected' && '✗'}
                                </span>
                                {deptName}
                                <span className="form-approval__dept-count">{count}</span>
                            </li>
                        );
                    })}
                </ul>
            </aside>

            {/* Main content */}
            <main className="form-approval__content">
                <header className="form-approval__header">
                    <div>
                        <h2 className="form-approval__title">
                            <span>📝</span> {selectedDepartment || 'Wybierz departament'}
                        </h2>
                        <p className="form-approval__subtitle">
                            Zatwierdzanie formularzy departamentu
                        </p>
                    </div>
                    {selectedDepartment && (
                        <div className={`form-approval__dept-status-badge form-approval__dept-status-badge--${currentStatus.status}`}>
                            {currentStatus.status === 'pending' && '⏳ Oczekuje na decyzję'}
                            {currentStatus.status === 'approved' && '✓ Zatwierdzony'}
                            {currentStatus.status === 'rejected' && '✗ Odrzucony'}
                        </div>
                    )}
                </header>

                {/* Global Stats */}
                <div className="form-approval__stats">
                    <div className="form-approval__stat form-approval__stat--pending">
                        <span className="form-approval__stat-value">{globalStats.pending}</span>
                        <span className="form-approval__stat-label">Oczekujące</span>
                    </div>
                    <div className="form-approval__stat form-approval__stat--approved">
                        <span className="form-approval__stat-value">{globalStats.approved}</span>
                        <span className="form-approval__stat-label">Zatwierdzone</span>
                    </div>
                    <div className="form-approval__stat form-approval__stat--rejected">
                        <span className="form-approval__stat-value">{globalStats.rejected}</span>
                        <span className="form-approval__stat-label">Odrzucone</span>
                    </div>
                </div>

                {loading ? (
                    <div className="form-approval__loading">
                        <div className="form-approval__spinner"></div>
                        <p>Ładowanie danych...</p>
                    </div>
                ) : !selectedDepartment ? (
                    <div className="form-approval__empty">
                        <p>Wybierz departament z listy po lewej stronie</p>
                    </div>
                ) : (
                    <>
                        {/* Budget Summary for Department */}
                        <div className="form-approval__summary">
                            <h3 className="form-approval__summary-title">Podsumowanie budżetu</h3>
                            <div className="form-approval__summary-cards">
                                <div className="form-approval__summary-card">
                                    <span className="form-approval__summary-icon">📝</span>
                                    <span className="form-approval__summary-value">{summary.rowCount}</span>
                                    <span className="form-approval__summary-label">Wierszy</span>
                                </div>
                                <div className="form-approval__summary-card">
                                    <span className="form-approval__summary-icon">💰</span>
                                    <span className="form-approval__summary-value">{formatCurrency(summary.totalPotrzeby2026)}</span>
                                    <span className="form-approval__summary-label">Potrzeby 2026</span>
                                </div>
                                <div className="form-approval__summary-card">
                                    <span className="form-approval__summary-icon">📈</span>
                                    <span className="form-approval__summary-value">{formatCurrency(summary.totalLimit2026)}</span>
                                    <span className="form-approval__summary-label">Limit 2026</span>
                                </div>
                                <div className="form-approval__summary-card">
                                    <span className="form-approval__summary-icon">💵</span>
                                    <span className="form-approval__summary-value">{formatCurrency(summary.totalPotrzeby2027)}</span>
                                    <span className="form-approval__summary-label">Potrzeby 2027</span>
                                </div>
                            </div>
                        </div>

                        {/* Data preview */}
                        {filteredData.length > 0 && (
                            <div className="form-approval__data-preview">
                                <h3>Dane formularzy ({filteredData.length})</h3>
                                <div className="form-approval__table-scroll">
                                    <table className="form-approval__table">
                                        <thead>
                                            <tr>
                                                <th>Lp.</th>
                                                <th>Część</th>
                                                <th>Dział</th>
                                                <th>Rozdział</th>
                                                <th>Paragraf</th>
                                                <th>Nazwa zadania</th>
                                                <th>Potrzeby 2026</th>
                                                <th>Limit 2026</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredData.slice(0, 10).map((row, idx) => (
                                                <tr key={row.id}>
                                                    <td>{idx + 1}</td>
                                                    <td>{row.czesc}</td>
                                                    <td>{row.dzial}</td>
                                                    <td>{row.rozdzial}</td>
                                                    <td>{row.paragraf}</td>
                                                    <td>{row.nazwaZadania || '-'}</td>
                                                    <td className="form-approval__currency">{formatCurrency(row.potrzeby2026 || 0)}</td>
                                                    <td className="form-approval__currency">{formatCurrency(row.limit2026 || 0)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {filteredData.length > 10 && (
                                    <p className="form-approval__more-rows">...i {filteredData.length - 10} więcej wierszy</p>
                                )}
                            </div>
                        )}

                        {filteredData.length === 0 && (
                            <div className="form-approval__empty">
                                <p>Brak formularzy dla tego departamentu</p>
                            </div>
                        )}

                        {/* Decision section */}
                        {currentStatus.status === 'pending' && filteredData.length > 0 && (
                            <div className="form-approval__decision">
                                <h3>Decyzja dla departamentu</h3>
                                <div className="form-approval__comment-field">
                                    <label>Komentarz (wymagany przy odrzuceniu):</label>
                                    <textarea
                                        value={comment}
                                        onChange={e => setComment(e.target.value)}
                                        placeholder="Wpisz komentarz do decyzji..."
                                        rows={3}
                                    />
                                </div>
                                <div className="form-approval__decision-buttons">
                                    <button
                                        className="form-approval__btn form-approval__btn--approve-large"
                                        onClick={handleApproveDepartment}
                                    >
                                        ✓ Zatwierdź wszystkie formularze departamentu
                                    </button>
                                    <button
                                        className="form-approval__btn form-approval__btn--reject-large"
                                        onClick={handleRejectDepartment}
                                    >
                                        ✗ Odrzuć wszystkie formularze departamentu
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentStatus.status !== 'pending' && currentStatus.komentarz && (
                            <div className="form-approval__decision-result">
                                <strong>Komentarz:</strong> {currentStatus.komentarz}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};
