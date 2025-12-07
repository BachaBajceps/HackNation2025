import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MinistryTaskForm } from '../../components/MinistryTaskForm';
import { BudgetOverview } from '../../components/BudgetOverview';
import { FormApproval } from '../../components/FormApproval';
import './FinanceOfficePage.css';

type FinanceView = 'dashboard' | 'budget' | 'forms' | 'reports' | 'settings' | 'ministry';

export const FinanceOfficePage: React.FC = () => {
    const { logout } = useAuth();
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
                        <div className="finance-page__placeholder">
                            <h2>📈 Raporty</h2>
                            <p>Moduł w przygotowaniu...</p>
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
                                <h3 className="finance-page__card-title">Zadanie od Ministerstwa</h3>
                                <p className="finance-page__card-desc">
                                    Utwórz nowe zadanie budżetowe dla departamentów
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
                <button className="finance-page__logout" onClick={logout}>
                    Wyloguj się
                </button>
            </header>

            <main className="finance-page__content">
                {renderContent()}
            </main>
        </div>
    );
};

