import React, { useState, useEffect } from 'react';
import { Formularz } from '../types/budget';

interface DepartmentDashboardProps {
    departamentId?: number; // Opcjonalne, domyślnie 1
}

export const DepartmentDashboard: React.FC<DepartmentDashboardProps> = ({ departamentId = 1 }) => {
    const [forms, setForms] = useState<Formularz[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sendLoading, setSendLoading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Mockowe zadanie_id, normalnie powinno przychodzić z kontekstu lub wyboru
    const zadanieId = 1;

    const fetchForms = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/formularze?departament_id=${departamentId}&zadanie_id=${zadanieId}`);
            const result = await response.json();
            if (result.success) {
                setForms(result.data);
            } else {
                setError(result.error || 'Błąd pobierania formularzy');
            }
        } catch (err) {
            setError('Błąd połączenia z serwerem');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchForms();
    }, [departamentId, zadanieId]);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            alert(`Wybrano plik: ${file.name}. Import danych zostanie zaimplementowany później.`);
            // TODO: Implement Excel import logic here
        }
        // Reset input value to allow selecting the same file again
        if (event.target) {
            event.target.value = '';
        }
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
                fetchForms(); // Odśwież listę
            } else {
                alert('Błąd: ' + (result.error || 'Nieznany błąd'));
            }
        } catch (err) {
            alert('Błąd połączenia z serwerem');
        } finally {
            setSendLoading(false);
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'draft': return 'Roboczy';
            case 'submitted': return 'Wysłany';
            case 'historical': return 'Historyczny';
            case 'archived': return 'Archiwalny';
            default: return status;
        }
    };

    return (
        <div className="department-dashboard">
            <header className="dashboard-header">
                <h2>Panel Departamentu (ID: {departamentId})</h2>
                <div className="header-actions">
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                    />
                    <button
                        className="btn btn-secondary"
                        onClick={handleImportClick}
                        disabled={loading}
                        style={{ marginRight: '10px' }}
                    >
                        Załaduj dane z XLS
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSendAll}
                        disabled={sendLoading || loading}
                    >
                        {sendLoading ? 'Wysyłanie...' : 'Wyślij wszystkie formularze'}
                    </button>
                </div>
            </header>

            {error && <div className="error-message">{error}</div>}

            {loading ? (
                <div className="loading">Ładowanie...</div>
            ) : (
                <table className="forms-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Modyfikacja</th>
                            <th>Kody (R/P)</th>
                            <th>Zadanie</th>
                            <th>Status</th>
                            <th>Kwota 2026</th>
                        </tr>
                    </thead>
                    <tbody>
                        {forms.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center' }}>Brak formularzy</td></tr>
                        ) : (
                            forms.map(form => (
                                <tr key={form.id} className={`status-${form.status}`}>
                                    <td>{form.id}</td>
                                    <td>{new Date(form.created_at).toLocaleDateString()}</td>
                                    <td>{form.kod_rozdzialu || '-'}/{form.kod_paragrafu || '-'}</td>
                                    <td>{form.nazwa_zadania || '(Brak nazwy)'}</td>
                                    <td>
                                        <span className={`badge badge-${form.status}`}>
                                            {getStatusLabel(form.status)}
                                        </span>
                                    </td>
                                    <td>{form.rok_1?.toLocaleString() || '0'} PLN</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}

            <style>{`
                .department-dashboard {
                    padding: 20px;
                    max-width: 1200px;
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
                .forms-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .forms-table th, .forms-table td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid #eee;
                }
                .forms-table th {
                    background-color: #f8f9fa;
                    font-weight: 600;
                }
                .badge {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 0.85em;
                }
                .badge-draft { background: #e2e8f0; color: #4a5568; }
                .badge-submitted { background: #c6f6d5; color: #276749; }
                .btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    border: none;
                    cursor: pointer;
                    font-weight: 500;
                }
                .btn-primary {
                    background-color: #3182ce;
                    color: white;
                }
                .btn-primary:hover {
                    background-color: #2c5282;
                }
                .btn-secondary {
                    background-color: #718096;
                    color: white;
                }
                .btn-secondary:hover {
                    background-color: #4a5568;
                }
                .btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};
