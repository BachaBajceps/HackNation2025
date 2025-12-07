import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { FinanceOfficePage } from './pages/FinanceOfficePage';
import { BudgetForm } from './components/BudgetForm';
import { MinistryTaskForm } from './components/MinistryTaskForm';
import './App.css';

type FormType = 'budget' | 'ministry';

function MainApp() {
    const { isLoggedIn, userType, departmentName, logout } = useAuth();
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
                    <div className="app__form-selector">
                        <label htmlFor="formType" className="app__form-selector-label">Formularz:</label>
                        <select
                            id="formType"
                            value={activeForm}
                            onChange={(e) => setActiveForm(e.target.value as FormType)}
                            className="app__form-selector-select"
                        >
                            <option value="budget">Formularz Budżetowy</option>
                            <option value="ministry">Formularz Zadania od Ministerstwa</option>
                        </select>
                    </div>
                    <button className="app__logout-btn" onClick={logout}>
                        Wyloguj się
                    </button>
                </div>
            </header>

            <main className="app__main">
                {activeForm === 'budget' && <BudgetForm />}
                {activeForm === 'ministry' && <MinistryTaskForm />}
            </main>

            <footer className="app__footer">
                <p>© 2024 System Budżetowy • Wersja testowa</p>
            </footer>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <MainApp />
        </AuthProvider>
    );
}

export default App;


