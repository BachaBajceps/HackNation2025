
import React from 'react';
import { Link } from 'react-router-dom';

export const DashboardBBF: React.FC = () => {
    return (
        <div className="dashboard-container">
            <h2>Panel Biura Budżetowo-Finansowego</h2>
            <div className="dashboard-cards">
                <div className="card">
                    <h3>Limity Finansowe</h3>
                    <p>Definiuj limity dla departamentów.</p>
                    <Link to="/bbf/limits" className="btn-primary">Zarządzaj Limitami</Link>
                </div>
            </div>
        </div>
    );
};
