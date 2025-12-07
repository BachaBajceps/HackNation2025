import React from 'react';
import { ParsedFormularz } from '../utils/excelParser';

interface ImportPreviewModalProps {
    data: ParsedFormularz[];
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({
    data,
    onConfirm,
    onCancel,
    isLoading = false,
}) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content import-preview-modal">
                <header className="modal-header">
                    <h3>Podgląd importu</h3>
                    <p className="modal-subtitle">Znaleziono {data.length} wierszy do importu</p>
                </header>

                <div className="modal-body">
                    <div className="preview-table-container">
                        <table className="preview-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Rozdział</th>
                                    <th>Paragraf</th>
                                    <th>Nazwa zadania</th>
                                    <th>2026</th>
                                    <th>2027</th>
                                    <th>2028</th>
                                    <th>2029</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.slice(0, 20).map((row, idx) => (
                                    <tr key={idx}>
                                        <td>{idx + 1}</td>
                                        <td>{row.kod_rozdzialu || '-'}</td>
                                        <td>{row.kod_paragrafu || '-'}</td>
                                        <td className="task-name-cell" title={row.nazwa_zadania || ''}>
                                            {row.nazwa_zadania?.substring(0, 50) || '-'}
                                            {(row.nazwa_zadania?.length || 0) > 50 && '...'}
                                        </td>
                                        <td className="numeric">{row.rok_1?.toLocaleString() || '-'}</td>
                                        <td className="numeric">{row.rok_2?.toLocaleString() || '-'}</td>
                                        <td className="numeric">{row.rok_3?.toLocaleString() || '-'}</td>
                                        <td className="numeric">{row.rok_4?.toLocaleString() || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {data.length > 20 && (
                            <p className="more-rows-hint">...i {data.length - 20} więcej wierszy</p>
                        )}
                    </div>
                </div>

                <footer className="modal-footer">
                    <button
                        className="btn btn-secondary"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Anuluj
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Importowanie...' : `Importuj ${data.length} wierszy`}
                    </button>
                </footer>
            </div>

            <style>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: var(--color-surface);
                    border-radius: var(--radius-lg);
                    box-shadow: var(--shadow-lg);
                    max-width: 90vw;
                    max-height: 80vh;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .import-preview-modal {
                    width: 900px;
                }
                .modal-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--color-border);
                }
                .modal-header h3 {
                    margin: 0;
                    color: var(--color-text);
                }
                .modal-subtitle {
                    margin: 0.5rem 0 0;
                    color: var(--color-text-secondary);
                    font-size: 0.9rem;
                }
                .modal-body {
                    flex: 1;
                    overflow: auto;
                    padding: 1rem;
                }
                .preview-table-container {
                    overflow-x: auto;
                }
                .preview-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.875rem;
                }
                .preview-table th,
                .preview-table td {
                    padding: 0.75rem;
                    text-align: left;
                    border-bottom: 1px solid var(--color-border);
                }
                .preview-table th {
                    background: var(--color-surface-alt);
                    font-weight: 600;
                    position: sticky;
                    top: 0;
                }
                .preview-table .numeric {
                    text-align: right;
                    font-variant-numeric: tabular-nums;
                }
                .task-name-cell {
                    max-width: 200px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .more-rows-hint {
                    text-align: center;
                    color: var(--color-text-muted);
                    padding: 1rem;
                    font-style: italic;
                }
                .modal-footer {
                    padding: 1rem 1.5rem;
                    border-top: 1px solid var(--color-border);
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                }
            `}</style>
        </div>
    );
};
