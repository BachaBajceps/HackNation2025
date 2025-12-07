import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { MinistryTaskForm } from '../../components/MinistryTaskForm';
import { BudgetOverview } from '../../components/BudgetOverview';
import { FormApproval } from '../../components/FormApproval';
import { BBFSummary } from '../../components/BBFSummary';
import './FinanceOfficePage.css';

type FinanceView = 'dashboard' | 'budget' | 'forms' | 'reports' | 'settings' | 'ministry' | 'summary';

export const FinanceOfficePage: React.FC = () => {
    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [activeView, setActiveView] = useState<FinanceView>('dashboard');

    const renderContent = () => {
        switch (activeView) {
            case 'ministry':
                return (
                    <div className="finance-page__view">
                        <button className="finance-page__back-btn" onClick={() => setActiveView('dashboard')}>
                            ← Powrót do panelu
                        </button>
                        <MinistryTaskForm />
                    </div>
                );
            case 'budget':
                return (
                    <div className="finance-page__view">
                        <button className="finance-page__back-btn" onClick={() => setActiveView('dashboard')}>
                            ← Powrót do panelu
                        </button>
                        <BudgetOverview />
                    </div>
                );
            case 'forms':
                return (
                    <div className="finance-page__view">
                        <button className="finance-page__back-btn" onClick={() => setActiveView('dashboard')}>
                            ← Powrót do panelu
                        </button>
                        <FormApproval />
                    </div>
                );
            case 'reports':
                return (
                    <div className="finance-page__view">
                        <button className="finance-page__back-btn" onClick={() => setActiveView('dashboard')}>
                            ← Powrót do panelu
                        </button>
                        <div className="finance-page__reports-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                            <h2 style={{ marginBottom: '2rem', color: 'var(--color-text)', fontSize: '1.8rem' }}>Centrum Raportowania</h2>

                            <div className="finance-page__reports-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                                {/* Karta raportu głównego */}
                                <div className="report-card" style={{
                                    background: 'var(--color-surface)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '16px',
                                    padding: '2rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1.5rem',
                                    boxShadow: 'var(--shadow-md)',
                                    transition: 'transform 0.2s ease'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            background: 'var(--color-primary-alpha)',
                                            padding: '1rem',
                                            borderRadius: '12px',
                                            fontSize: '1.5rem'
                                        }}>
                                            📊
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
                                            Zbiorczy Raport Budżetowy
                                        </h3>
                                    </div>

                                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                                        Kompleksowe podsumowanie procesu planowania budżetu na rok 2026. Zawiera bilans potrzeb względem limitów oraz szczegółowe zestawienie dla każdego departamentu.
                                    </p>

                                    <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                        <button
                                            onClick={async (e) => {
                                                const btn = e.currentTarget;
                                                const originalContent = btn.innerHTML;
                                                btn.innerHTML = '⏳ Generowanie...';
                                                btn.disabled = true;
                                                btn.style.opacity = '0.7';

                                                try {
                                                    const res = await fetch('/api/reports/budget-summary');
                                                    if (!res.ok) throw new Error('Błąd generowania');

                                                    const blob = await res.blob();
                                                    const url = window.URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `Raport_Budzetowy_2026_${new Date().toISOString().slice(0, 10)}.pdf`;
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    document.body.removeChild(a);
                                                    window.URL.revokeObjectURL(url);
                                                } catch (err) {
                                                    alert('Wystąpił błąd podczas generowania raportu. Spróbuj ponownie.');
                                                    console.error(err);
                                                } finally {
                                                    btn.innerHTML = originalContent;
                                                    btn.disabled = false;
                                                    btn.style.opacity = '1';
                                                }
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '0.85rem',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: 'var(--color-primary)',
                                                color: 'white',
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            <span>📥</span> Pobierz PDF
                                        </button>
                                    </div>
                                </div>

                                {/* Placeholder na przyszłe raporty */}
                                <div className="report-card" style={{
                                    background: 'var(--color-surface)',
                                    border: '1px dashed var(--color-border)',
                                    borderRadius: '16px',
                                    padding: '2rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '1rem',
                                    opacity: 0.6
                                }}>
                                    <span style={{ fontSize: '2rem', filter: 'grayscale(1)' }}>📈</span>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-secondary)' }}>
                                        Analiza Wydatków (Wkrótce)
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'settings':
                return (
                    <div className="finance-page__view">
                        <button className="finance-page__back-btn" onClick={() => setActiveView('dashboard')}>
                            ← Powrót do panelu
                        </button>
                        <div className="finance-page__placeholder">
                            <h2>⚙️ Ustawienia</h2>
                            <p>Moduł w przygotowaniu...</p>
                        </div>
                    </div>
                );
            case 'summary':
                return (
                    <div className="finance-page__view">
                        <button className="finance-page__back-btn" onClick={() => setActiveView('dashboard')}>
                            ← Powrót do panelu
                        </button>
                        <BBFSummary />
                    </div>
                );
            default:
                return (
                    <>
                        <div className="finance-page__welcome">
                            <h2 className="finance-page__welcome-title">
                                Panel Biura Budżetowo-Finansowego
                            </h2>
                            <p className="finance-page__welcome-subtitle">
                                Zarządzaj budżetem i monitoruj formularze departamentów
                            </p>
                        </div>

                        <div className="finance-page__cards">
                            <div className="finance-page__card" onClick={() => setActiveView('ministry')}>
                                <div className="finance-page__card-icon">📋</div>
                                <h3 className="finance-page__card-title">Decyzja Budżetowa</h3>
                                <p className="finance-page__card-desc">
                                    Definiuj limity wydatków dla departamentów
                                </p>
                            </div>
                            <div className="finance-page__card" onClick={() => setActiveView('budget')}>
                                <div className="finance-page__card-icon">📊</div>
                                <h3 className="finance-page__card-title">Przegląd Budżetu</h3>
                                <p className="finance-page__card-desc">
                                    Sprawdź status budżetu wszystkich departamentów
                                </p>
                            </div>
                            <div className="finance-page__card" onClick={() => setActiveView('forms')}>
                                <div className="finance-page__card-icon">📝</div>
                                <h3 className="finance-page__card-title">Formularze</h3>
                                <p className="finance-page__card-desc">
                                    Przeglądaj i zatwierdzaj przesłane formularze
                                </p>
                            </div>
                            <div className="finance-page__card" onClick={() => setActiveView('reports')}>
                                <div className="finance-page__card-icon">📈</div>
                                <h3 className="finance-page__card-title">Raporty</h3>
                                <p className="finance-page__card-desc">
                                    Generuj raporty zbiorcze i analizy
                                </p>
                            </div>
                            <div className="finance-page__card" onClick={() => setActiveView('settings')}>
                                <div className="finance-page__card-icon">⚙️</div>
                                <h3 className="finance-page__card-title">Ustawienia</h3>
                                <p className="finance-page__card-desc">
                                    Zarządzaj limitami i parametrami systemu
                                </p>
                            </div>
                            <div className="finance-page__card" onClick={() => setActiveView('summary')}>
                                <div className="finance-page__card-icon">📑</div>
                                <h3 className="finance-page__card-title">Zestawienie BBF</h3>
                                <p className="finance-page__card-desc">
                                    Pełne zestawienie danych budżetowych
                                </p>
                            </div>
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="finance-page">
            <header className="finance-page__header">
                <h1 className="finance-page__title">
                    <span className="finance-page__icon">🏛️</span>
                    Biuro Budżetowo-Finansowe
                </h1>
                <div className="finance-page__header-actions">
                    <button
                        className="finance-page__theme-toggle"
                        onClick={toggleTheme}
                        title={`Przełącz na tryb ${theme === 'light' ? 'ciemny' : 'jasny'}`}
                    >
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                    <button className="finance-page__logout" onClick={logout}>
                        Wyloguj się
                    </button>
                </div>
            </header>

            <main className="finance-page__content">
                {renderContent()}
            </main>
        </div>
    );
};

