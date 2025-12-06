import { BudgetForm } from './components/BudgetForm';
import './App.css';

function App() {
    return (
        <div className="app">
            <header className="app__header">
                <div className="app__header-content">
                    <h1 className="app__title">
                        <span className="app__logo">📊</span>
                        Formularz Budżetowy
                    </h1>
                    <p className="app__subtitle">Wiersz budżetowy z klasyfikacją i danymi finansowymi</p>
                </div>
                <div className="app__version">
                    <span className="app__version-label">Wersja</span>
                    <span className="app__version-value">Grudzień 2024</span>
                </div>
            </header>

            <main className="app__main">
                <BudgetForm />
            </main>

            <footer className="app__footer">
                <p>© 2024 System Budżetowy • Wersja testowa</p>
            </footer>
        </div>
    );
}

export default App;
