import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Formularz } from '../types/budget';
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
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface DepartmentDashboardProps { }

export const DepartmentDashboard: React.FC<DepartmentDashboardProps> = () => {
    const { departmentName } = useAuth();
    const [budgetPositions, setBudgetPositions] = useState<BudgetPosition[]>([]);
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
                    departament_id: departamentId
                })
            });
            const result = await response.json();
            if (result.success) {
                alert(`Wysłano ${result.data.zmienione} formularzy.`);
                fetchBudgetPositions(); // Odśwież listę
            } else {
                alert('Błąd: ' + (result.error || 'Nieznany błąd'));
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

            {importData && (
                <ImportPreviewModal
                    data={importData}
                    onConfirm={handleImportConfirm}
                    onCancel={handleImportCancel}
                    isLoading={importLoading}
                />
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
                .btn-primary {
                    background-color: #007bff;
                    color: white;
                    border: none;
                }
                .btn-primary:hover {
                    background-color: #0056b3;
                }
                .btn-success {
                    background-color: #28a745;
                    color: white;
                    border: none;
                }
                .btn-success:hover {
                    background-color: #218838;
                }
                .btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
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
