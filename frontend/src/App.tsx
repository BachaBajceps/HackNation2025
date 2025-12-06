
import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { BudgetForm } from './components/BudgetForm/BudgetForm';
import { DashboardBBF } from './pages/DashboardBBF';
import { LimitsManager } from './pages/LimitsManager';
import './App.css';

function App() {
    return (
        <BrowserRouter>
            <div className="app-container">
                <header style={{ padding: '1rem', borderBottom: '1px solid #ccc', marginBottom: '1rem' }}>
                    <h1 style={{ margin: 0 }}>System Planowania Budżetu</h1>
                    <nav style={{ marginTop: '0.5rem' }}>
                        <Link to="/" style={{ marginRight: '1rem' }}>Formularz</Link>
                        <Link to="/bbf">Panel BBF</Link>
                        <Link to="/bbf/limits" style={{ marginLeft: '1rem' }}>Zarządzaj Limitami</Link> {/* Added link for LimitsManager */}
                    </nav>
                </header>

                <main>
                    <Routes>
                        <Route path="/" element={<BudgetForm />} />
                        <Route path="/bbf" element={<DashboardBBF />} />
                        <Route path="/bbf/limits" element={<LimitsManager />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;
