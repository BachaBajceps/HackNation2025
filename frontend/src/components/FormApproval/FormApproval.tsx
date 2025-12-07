import React, { useState, useEffect, useMemo } from 'react';
import { departments } from '../../data/dictionaries';
import './FormApproval.css';

interface BudgetRow {
    id: number;
    czesc: string;
    dzial: string;
    rozdzial: string;
    paragraf: string;
    komorkaOrganizacyjna: string;
    nazwaZadania: string;
    uzasadnienie: string;
    potrzeby2026: number | null;
    limit2026: number | null;
    status?: 'pending' | 'approved' | 'rejected';
}

export const FormApproval: React.FC = () => {
    const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
    const [data, setData] = useState<BudgetRow[]>([]);
    const [loading, setLoading] = useState(false);

    const sortedDepartments = useMemo(() =>
        [...departments].sort((a, b) => a.name.localeCompare(b.name, 'pl')),
        []
    );

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
                    // Add mock status for demo
                    const dataWithStatus = (result.data || []).map((row: BudgetRow) => ({
                        ...row,
                        status: 'pending' as const
                    }));
                    setData(dataWithStatus);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedDepartment]);

    const filteredData = useMemo(() => {
        if (selectedDepartment === 'all') return data;
        return data.filter(row => row.komorkaOrganizacyjna === selectedDepartment);
    }, [data, selectedDepartment]);

    const handleApprove = (id: number) => {
        setData(prev => prev.map(row =>
            row.id === id ? { ...row, status: 'approved' as const } : row
        ));
    };

    const handleReject = (id: number) => {
        setData(prev => prev.map(row =>
            row.id === id ? { ...row, status: 'rejected' as const } : row
        ));
    };

    const handleApproveAll = () => {
        setData(prev => prev.map(row => ({ ...row, status: 'approved' as const })));
    };

    const formatCurrency = (value: number | null) => {
        if (value === null || value === undefined) return '-';
        return value.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' });
    };

    const pendingCount = filteredData.filter(r => r.status === 'pending').length;
    const approvedCount = filteredData.filter(r => r.status === 'approved').length;
    const rejectedCount = filteredData.filter(r => r.status === 'rejected').length;

    return (
        <div className="form-approval">
            {/* Left sidebar */}
            <aside className="form-approval__sidebar">
                <h2 className="form-approval__sidebar-title">
                    <span>🏢</span> Komórki organizacyjne
                </h2>
                <ul className="form-approval__dept-list">
                    <li
                        className={`form-approval__dept-item ${selectedDepartment === 'all' ? 'form-approval__dept-item--active' : ''}`}
                        onClick={() => setSelectedDepartment('all')}
                    >
                        <span>📋</span> Wszystkie formularze
                    </li>
                    {sortedDepartments.map(dept => (
                        <li
                            key={dept.code}
                            className={`form-approval__dept-item ${selectedDepartment === dept.name ? 'form-approval__dept-item--active' : ''}`}
                            onClick={() => setSelectedDepartment(dept.name)}
                        >
                            <span>🏛️</span> {dept.name}
                        </li>
                    ))}
                </ul>
            </aside>

            {/* Main content */}
            <main className="form-approval__content">
                <header className="form-approval__header">
                    <div>
                        <h2 className="form-approval__title">
                            <span>📝</span> Zatwierdzanie Formularzy
                        </h2>
                        <p className="form-approval__subtitle">
                            {selectedDepartment === 'all'
                                ? 'Przegląd wszystkich formularzy'
                                : `Formularze: ${selectedDepartment}`
                            }
                        </p>
                    </div>
                    {pendingCount > 0 && (
                        <button className="form-approval__approve-all" onClick={handleApproveAll}>
                            ✓ Zatwierdź wszystkie ({pendingCount})
                        </button>
                    )}
                </header>

                {/* Stats */}
                <div className="form-approval__stats">
                    <div className="form-approval__stat form-approval__stat--pending">
                        <span className="form-approval__stat-value">{pendingCount}</span>
                        <span className="form-approval__stat-label">Oczekujące</span>
                    </div>
                    <div className="form-approval__stat form-approval__stat--approved">
                        <span className="form-approval__stat-value">{approvedCount}</span>
                        <span className="form-approval__stat-label">Zatwierdzone</span>
                    </div>
                    <div className="form-approval__stat form-approval__stat--rejected">
                        <span className="form-approval__stat-value">{rejectedCount}</span>
                        <span className="form-approval__stat-label">Odrzucone</span>
                    </div>
                </div>

                {/* Forms list */}
                {loading ? (
                    <div className="form-approval__loading">
                        <div className="form-approval__spinner"></div>
                        <p>Ładowanie formularzy...</p>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="form-approval__empty">
                        <p>Brak formularzy do wyświetlenia</p>
                    </div>
                ) : (
                    <div className="form-approval__list">
                        {filteredData.map(row => (
                            <div key={row.id} className={`form-approval__card form-approval__card--${row.status}`}>
                                <div className="form-approval__card-header">
                                    <span className="form-approval__card-dept">{row.komorkaOrganizacyjna}</span>
                                    <span className={`form-approval__card-status form-approval__card-status--${row.status}`}>
                                        {row.status === 'pending' && '⏳ Oczekuje'}
                                        {row.status === 'approved' && '✓ Zatwierdzony'}
                                        {row.status === 'rejected' && '✗ Odrzucony'}
                                    </span>
                                </div>
                                <h3 className="form-approval__card-title">{row.nazwaZadania || 'Bez nazwy'}</h3>
                                <p className="form-approval__card-desc">{row.uzasadnienie || 'Brak uzasadnienia'}</p>
                                <div className="form-approval__card-meta">
                                    <span>Część: {row.czesc}</span>
                                    <span>Dział: {row.dzial}</span>
                                    <span>Potrzeby: {formatCurrency(row.potrzeby2026)}</span>
                                </div>
                                {row.status === 'pending' && (
                                    <div className="form-approval__card-actions">
                                        <button
                                            className="form-approval__btn form-approval__btn--approve"
                                            onClick={() => handleApprove(row.id)}
                                        >
                                            ✓ Zatwierdź
                                        </button>
                                        <button
                                            className="form-approval__btn form-approval__btn--reject"
                                            onClick={() => handleReject(row.id)}
                                        >
                                            ✗ Odrzuć
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};
