import { useState } from 'react';
import { BudgetForm } from './components/BudgetForm';
import { MinistryTaskForm } from './components/MinistryTaskForm';
import './App.css';

type FormType = 'budget' | 'ministry';

function App() {
    const [activeForm, setActiveForm] = useState<FormType>('budget');

    return (
        <div className="app">
            <header className="app__header">
                <div className="app__header-content">
                    <h1 className="app__title">
                        <span className="app__logo">📊</span>
                        System Formularzy
                    </h1>
                    <p className="app__subtitle">Wybierz typ formularza z listy poniżej</p>
                </div>
                <div className="app__form-selector">
                    <label htmlFor="formType" className="app__form-selector-label">Typ formularza:</label>
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

export default App;

