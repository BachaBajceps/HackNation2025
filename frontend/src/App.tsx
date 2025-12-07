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
    const [activeForm, setActiveForm] = useState<FormType>('budget');

    // Not logged in -> show login page
    if (!isLoggedIn) {
        return <LoginPage />;
    }

    // Finance office user -> show finance page
    if (userType === 'finance') {
        return <FinanceOfficePage />;
    }

    // Department user -> show form with department header
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
                    <div className="app__form-selector">
                        <label htmlFor="formType" className="app__form-selector-label">Widok:</label>
                        <select
                            id="formType"
                            value={activeForm}
                            onChange={(e) => setActiveForm(e.target.value as FormType)}
                            className="app__form-selector-select"
                        >
                            <option value="budget">Formularz Budżetowy</option>
                            <option value="notes">Uwagi od Ministra</option>
                            <option value="department">Panel Departamentu</option>
                        </select>
                    </div>
                    <button className="app__logout-btn" onClick={logout}>
                        Wyloguj się
                    </button>
                </div>
            </header>

            <main className="app__main">
                {activeForm === 'budget' && (
                    <BudgetForm defaultKomorkaOrganizacyjna={departmentName} />
                )}
                {activeForm === 'notes' && (
                    <MinistryNotes
                        departmentId={departmentId || 1}
                        departmentName={departmentName || ''}
                    />
                )}
                {activeForm === 'department' && (
                    <DepartmentDashboard />
                )}
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
