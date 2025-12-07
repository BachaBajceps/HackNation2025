import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

import { parseExcelFile, ParsedFormularz } from '../utils/excelParser';
import { ImportPreviewModal } from './ImportPreviewModal';

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
    status: string;
}

interface MinistryTask {
    id: number;
    komorka_organizacyjna: string | null;
    dzial: string | null;
    rozdzial: string | null;
    paragraf: string | null;
    czesc_budzetowa: string | null;
    rok_budzetu: number;
    kwota: number;
    termin_do: string;
    stan: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface DepartmentDashboardProps { }

export const DepartmentDashboard: React.FC<DepartmentDashboardProps> = () => {
    const { departmentName } = useAuth();
    const [budgetPositions, setBudgetPositions] = useState<BudgetPosition[]>([]);
    const [ministryTasks, setMinistryTasks] = useState<MinistryTask[]>([]);
    const [loading, setLoading] = useState(false);

    // Excel import state
    const [importData, setImportData] = useState<ParsedFormularz[] | null>(null);
    const [importLoading, setImportLoading] = useState(false);
    const [sendLoading, setSendLoading] = useState(false);

    // Ref dla input file
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Mockowe dane - w produkcji powinny pochodzić z kontekstu lub API
    const zadanieId = 1;
    // Zakładamy, że ID departamentu przychodzi z AuthContext lub mapowania
    const departamentId = 1;

    const fetchBudgetPositions = async () => {
        setLoading(true);
        try {
            const komorka = departmentName || '';

            // Parallel fetch
            const [budgetRes, tasksRes] = await Promise.all([
                fetch(`/api/budzet/zestawienie?komorka=${encodeURIComponent(komorka)}`),
                fetch(`/api/zadanie-ministerstwo?komorka=${encodeURIComponent(komorka)}`)
            ]);

            const budgetResult = await budgetRes.json();
            const tasksResult = await tasksRes.json();

            if (budgetResult.success) {
                setBudgetPositions(budgetResult.data || []);
            }
            if (tasksResult.success) {
                setMinistryTasks(tasksResult.data || []);
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBudgetPositions();
    }, [departmentName]);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const parsed = await parseExcelFile(file);
                if (parsed.length === 0) {
                    alert('Plik Excel nie zawiera danych do importu.');
                    return;
                }
                setImportData(parsed);
            } catch (err) {
                alert(`Błąd: ${err instanceof Error ? err.message : 'Nieznany błąd'}`);
            }
        }
        // Reset input value to allow selecting the same file again
        if (event.target) {
            event.target.value = '';
        }
    };

    const handleImportConfirm = async () => {
        if (!importData) return;

        setImportLoading(true);
        try {
            const response = await fetch('/api/formularze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    akcja: 'bulk_import',
                    departament_id: departamentId,
                    zadanie_id: zadanieId,
                    formularze: importData,
                })
            });
            const result = await response.json();
            if (result.success) {
                alert(`Pomyślnie zaimportowano ${result.data?.imported || importData.length} formularzy.`);
                setImportData(null);
                fetchBudgetPositions();
            } else {
                alert('Błąd importu: ' + (result.error || 'Nieznany błąd'));
            }
        } catch (err) {
            alert('Błąd połączenia z serwerem');
        } finally {
            setImportLoading(false);
        }
    };

    const handleImportCancel = () => {
        setImportData(null);
    };

    const handleSendAll = async () => {
        if (!confirm('Czy na pewno chcesz wysłać wszystkie formularze robocze? Ta operacja jest nieodwracalna.')) return;

        setSendLoading(true);
        try {
            const response = await fetch('/api/formularze', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    akcja: 'wyslij_wszystkie',
                    zadanie_id: zadanieId,
                    departament_id: departamentId,
                    komorka: departmentName
                })
            });
            const result = await response.json();
            if (result.success) {
                alert(`✅ Wysłano ${result.data.zmienione} formularzy.`);
                fetchBudgetPositions(); // Odśwież listę
            } else {
                // Show detailed error message
                let errorMsg = `❌ ${result.error}`;
                if (result.details) {
                    if (result.details.juzPrzeslane) {
                        errorMsg += `\n\nFormularzy już przesłanych: ${result.details.juzPrzeslane}`;
                    }
                    if (result.details.niespelniajaOgraniczen) {
                        errorMsg += `\n\nFormularzy niespełniających ograniczeń: ${result.details.niespelniajaOgraniczen}`;
                        if (result.details.bledy && result.details.bledy.length > 0) {
                            errorMsg += '\n\nSzczegóły błędów:';
                            result.details.bledy.slice(0, 5).forEach((b: { id: number; reason: string }) => {
                                errorMsg += `\n• Formularz #${b.id}: ${b.reason}`;
                            });
                            if (result.details.bledy.length > 5) {
                                errorMsg += `\n... i ${result.details.bledy.length - 5} więcej`;
                            }
                        }
                    }
                    if (result.details.przekroczenieBudzetu) {
                        const formatPLN = (val: number) => val.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' });
                        errorMsg += `\n\n📊 Szczegóły przekroczenia:`;
                        errorMsg += `\n• Suma potrzeb: ${formatPLN(result.details.sumaPotrzeb)}`;
                        errorMsg += `\n• Limit kwoty: ${formatPLN(result.details.limitKwoty)}`;
                        errorMsg += `\n• Przekroczenie: ${formatPLN(result.details.roznica)}`;
                    }
                }
                alert(errorMsg);
            }
        } catch (err) {
            alert('Błąd połączenia z serwerem');
        } finally {
            setSendLoading(false);
        }
    };

    const formatCurrency = (value: number | null) => {
        if (value === null || value === undefined) return '-';
        return value.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' });
    };

    const handleDelete = async (positionId: number) => {
        if (!confirm('Czy na pewno chcesz usunąć ten formularz? Ta operacja jest nieodwracalna.')) return;

        try {
            const response = await fetch(`/api/formularze?pozycjaId=${positionId}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (result.success) {
                alert('✅ Formularz został usunięty.');
                fetchBudgetPositions();
            } else {
                alert('❌ ' + (result.error || 'Nieznany błąd'));
            }
        } catch (err) {
            alert('Błąd połączenia z serwerem');
        }
    };

    const exportToExcel = () => {
        if (budgetPositions.length === 0) {
            alert('Brak danych do eksportu');
            return;
        }

        // CSV headers
        const headers = [
            'Lp.',
            'Część',
            'Dział',
            'Rozdział',
            'Paragraf',
            'Źródło finansowania',
            'Grupa wydatków',
            'Nazwa zadania',
            'Potrzeby 2026',
            'Limit 2026',
            'Różnica',
            'Status'
        ];

        const statusMap: Record<string, string> = {
            'draft': 'Roboczy',
            'sent': 'Przesłany',
            'approved': 'Zatwierdzony',
            'rejected': 'Odrzucony'
        };

        // Convert data to CSV rows
        const rows = budgetPositions.map((pos, index) => [
            index + 1,
            pos.czesc || '',
            pos.dzial || '',
            pos.rozdzial || '',
            pos.paragraf || '',
            pos.zrodloFinansowania || '',
            pos.grupaWydatkow || '',
            pos.nazwaZadania || pos.nazwaProjektu || '',
            pos.potrzeby2026?.toFixed(2) || '0.00',
            pos.limit2026?.toFixed(2) || '0.00',
            pos.roznica2026?.toFixed(2) || '0.00',
            statusMap[pos.status || ''] || pos.status || 'Brak'
        ]);

        // Build CSV content with BOM for Excel compatibility
        const BOM = '\uFEFF';
        const csvContent = BOM + [
            headers.join(';'),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${departmentName}_formularze_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    return (
        <div className="department-dashboard">
            <header className="dashboard-header">
                <h2>Panel Departamentu: {departmentName}</h2>
                <div className="header-actions">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        accept=".xlsx, .xls"
                    />
                    <button
                        className="btn btn-primary"
                        onClick={handleImportClick}
                        disabled={importLoading || loading}
                    >
                        Importuj Excel
                    </button>
                    <button
                        className="btn btn-success"
                        onClick={handleSendAll}
                        disabled={sendLoading || loading}
                        style={{ marginLeft: '10px' }}
                    >
                        {sendLoading ? 'Wysyłanie...' : 'Wyślij wszystko'}
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={fetchBudgetPositions}
                        disabled={loading}
                        style={{ marginLeft: '10px' }}
                    >
                        Odśwież
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={exportToExcel}
                        disabled={loading || budgetPositions.length === 0}
                        style={{ marginLeft: '10px' }}
                    >
                        📥 Eksportuj Excel
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="loading">Ładowanie...</div>
            ) : (
                <div className="dashboard-content">
                    <div className="table-container">
                        <h3>Decyzja Budżetowa - Limity Wydatków</h3>
                        <table className="forms-table">
                            <thead>
                                <tr>
                                    <th>Rok</th>
                                    <th>Część</th>
                                    <th>Dział</th>
                                    <th>Rozdział</th>
                                    <th>Paragraf</th>
                                    <th>Kwota</th>
                                    <th>Termin</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ministryTasks.length === 0 ? (
                                    <tr><td colSpan={8} style={{ textAlign: 'center' }}>Brak zadań przypisanych do Twojego departamentu</td></tr>
                                ) : (
                                    ministryTasks.map((task) => (
                                        <tr key={task.id}>
                                            <td>{task.rok_budzetu}</td>
                                            <td>{task.czesc_budzetowa || '-'}</td>
                                            <td>{task.dzial || '-'}</td>
                                            <td>{task.rozdzial || '-'}</td>
                                            <td>{task.paragraf || '-'}</td>
                                            <td className="currency">{formatCurrency(task.kwota)}</td>
                                            <td>{new Date(task.termin_do).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`status-badge status-${task.stan?.toLowerCase() || 'nowe'}`}>
                                                    {task.stan || 'Nowe'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="table-container" style={{ marginTop: '40px' }}>
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
                                    <th>Status</th>
                                    <th>Akcje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {budgetPositions.length === 0 ? (
                                    <tr><td colSpan={13} style={{ textAlign: 'center' }}>Brak formularzy dla tego departamentu</td></tr>
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
                                            <td>
                                                <span className={`status-badge status-${pos.status?.toLowerCase() || 'brak'}`}>
                                                    {pos.status === 'draft' ? 'Roboczy' :
                                                        pos.status === 'sent' ? 'Przesłany' :
                                                            pos.status === 'approved' ? 'Zatwierdzony' :
                                                                pos.status === 'rejected' ? 'Odrzucony' :
                                                                    pos.status || 'Brak'}
                                                </span>
                                            </td>
                                            <td>
                                                {(pos.status === 'draft' || pos.status === 'Roboczy' || !pos.status) && (
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleDelete(pos.id)}
                                                        title="Usuń formularz"
                                                    >
                                                        🗑️ Usuń
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                    </div>
                </div >
            )}

            {
                importData && (
                    <ImportPreviewModal
                        data={importData}
                        onConfirm={handleImportConfirm}
                        onCancel={handleImportCancel}
                        isLoading={importLoading}
                    />
                )
            }

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
                    border-bottom: 1px solid var(--color-border);
                }
                .dashboard-header h2 {
                    margin: 0;
                    color: var(--color-text);
                }
                .table-container h3 {
                    margin-top: 0;
                    margin-bottom: 15px;
                    font-size: 1.2rem;
                    color: var(--color-text-secondary);
                }
                .forms-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: var(--color-surface);
                    box-shadow: var(--shadow-sm);
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                    border: 1px solid var(--color-border);
                }
                .forms-table th, .forms-table td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid var(--color-border);
                    color: var(--color-text);
                }
                .forms-table th {
                    background-color: var(--color-surface-alt);
                    font-weight: 600;
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--color-text-secondary);
                }
                .forms-table tbody tr:hover {
                    background-color: var(--color-surface-alt);
                }
                .currency {
                    text-align: right;
                    font-family: 'JetBrains Mono', 'Consolas', monospace;
                    font-weight: 500;
                }
                .btn {
                    padding: 8px 16px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--color-border);
                    cursor: pointer;
                    font-weight: 500;
                    background: var(--color-surface);
                    color: var(--color-text);
                    transition: all 0.2s;
                }
                .btn:hover {
                    background: var(--color-surface-alt);
                }
                .btn-primary {
                    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
                    color: white;
                    border: none;
                }
                .btn-primary:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
                }
                .btn-success {
                    background: linear-gradient(135deg, var(--color-success) 0%, var(--color-success-dark) 100%);
                    color: white;
                    border: none;
                }
                .btn-success:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
                }
                .btn-secondary {
                    background: var(--color-surface);
                    color: var(--color-text);
                    border: 1px solid var(--color-border);
                }
                .btn-secondary:hover {
                    background: var(--color-surface-alt);
                    border-color: var(--color-primary);
                }
                .btn-danger {
                    background: linear-gradient(135deg, var(--color-error) 0%, #b91c1c 100%);
                    color: white;
                    border: none;
                }
                .btn-danger:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
                }
                .btn-sm {
                    padding: 4px 10px;
                    font-size: 0.8rem;
                }
                .btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .loading {
                    text-align: center;
                    padding: 40px;
                    color: var(--color-text-muted);
                }
                .status-badge {
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: 500;
                    white-space: nowrap;
                }
                .status-draft {
                    background: #fef3c7;
                    color: #92400e;
                }
                .status-sent {
                    background: #dbeafe;
                    color: #1e40af;
                }
                .status-approved {
                    background: #d1fae5;
                    color: #047857;
                }
                .status-rejected {
                    background: #fee2e2;
                    color: #b91c1c;
                }
                .status-brak {
                    background: var(--color-surface-alt);
                    color: var(--color-text-muted);
                }
            `}</style>
        </div >
    );
};
