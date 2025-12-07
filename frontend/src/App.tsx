import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { FinanceOfficePage } from './pages/FinanceOfficePage';
import { BudgetForm } from './components/BudgetForm';
import { MinistryNotes } from './components/MinistryNotes';
import { DepartmentDashboard } from './components/DepartmentDashboard';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import './App.css';

type FormType = 'budget' | 'notes' | 'department';

function MainApp() {
    const { isLoggedIn, userType, departmentName, departmentId, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    // Not logged in -> show login page
    if (!isLoggedIn) {
        return <LoginPage />;
    }

    // Finance office user -> show finance page
    if (userType === 'finance') {
        return <FinanceOfficePage />;
    }

    // Department user -> show tile-based dashboard
    const [activeView, setActiveView] = useState<FormType | 'dashboard'>('dashboard');

    const renderDepartmentContent = () => {
        switch (activeView) {
            case 'budget':
                return (
                    <div className="app__view">
                        <button className="app__back-btn" onClick={() => setActiveView('dashboard')}>
                            ← Powrót do panelu
                        </button>
                        <BudgetForm defaultKomorkaOrganizacyjna={departmentName} />
                    </div>
                );

            case 'department':
                return (
                    <div className="app__view">
                        <button className="app__back-btn" onClick={() => setActiveView('dashboard')}>
                            ← Powrót do panelu
                        </button>
                        <DepartmentDashboard />
                    </div>
                );
            default:
                return (
                    <>
                        <div className="app__welcome">
                            <h2 className="app__welcome-title">
                                Panel {departmentName}
                            </h2>
                            <p className="app__welcome-subtitle">
                                Wybierz moduł, nad którym chcesz pracować
                            </p>
                        </div>

                        <div className="app__cards">
                            <div className="app__card" onClick={() => setActiveView('budget')}>
                                <div className="app__card-icon">📝</div>
                                <h3 className="app__card-title">Formularz Budżetowy</h3>
                                <p className="app__card-desc">
                                    Utwórz i edytuj formularze budżetowe
                                </p>
                            </div>

                            <div className="app__card" onClick={() => setActiveView('department')}>
                                <div className="app__card-icon">📊</div>
                                <h3 className="app__card-title">Panel Departamentu</h3>
                                <p className="app__card-desc">
                                    Status formularzy i podsumowanie
                                </p>
                            </div>
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="app">
            <header className="app__header">
                <div className="app__header-content">
                    <h1 className="app__title">
                        <span className="app__logo">📊</span>
                        System Formularzy
                    </h1>
                    <p className="app__subtitle">
                        Zalogowano jako: <strong>{departmentName}</strong>
                    </p>
                </div>
                <div className="app__header-actions">
                    <button
                        className="app__theme-toggle"
                        onClick={toggleTheme}
                        title={`Przełącz na tryb ${theme === 'light' ? 'ciemny' : 'jasny'}`}
                    >
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                    <button className="app__logout-btn" onClick={logout}>
                        Wyloguj się
                    </button>
                </div>
            </header>

            <main className="app__main">
                {renderDepartmentContent()}
            </main>

            <footer className="app__footer">
                <p>© 2024 System Budżetowy • Wersja testowa</p>
            </footer>
        </div>
    );
}

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <MainApp />
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
