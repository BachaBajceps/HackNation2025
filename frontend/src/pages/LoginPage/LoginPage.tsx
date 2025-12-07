import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { departments } from '../../data/dictionaries';
import './LoginPage.css';

const FINANCE_OFFICE = 'Biuro Budżetowo-Finansowe';

export const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Build options: all departments + finance office
    const allOptions = [
        ...departments.map(d => d.name),
        FINANCE_OFFICE
    ];

    // Helper to generate credentials
    const getCredentials = (deptName: string) => {
        const normalizedName = deptName
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/-/g, '')
            .replace(/ą/g, 'a')
            .replace(/ć/g, 'c')
            .replace(/ę/g, 'e')
            .replace(/ł/g, 'l')
            .replace(/ń/g, 'n')
            .replace(/ó/g, 'o')
            .replace(/ś/g, 's')
            .replace(/ź/g, 'z')
            .replace(/ż/g, 'z');
        return {
            email: `${normalizedName}@mail.com`,
            password: normalizedName
        };
    };

    const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSelectedDepartment(value);
        if (value) {
            const creds = getCredentials(value);
            setEmail(creds.email);
            setPassword(creds.password);
        } else {
            setEmail('');
            setPassword('');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!selectedDepartment) {
            setError('Wybierz departament');
            return;
        }

        const expected = getCredentials(selectedDepartment);

        if (email.toLowerCase() !== expected.email) {
            setError('Nieprawidłowy adres email');
            return;
        }

        if (password !== expected.password) {
            setError('Nieprawidłowe hasło');
            return;
        }

        // Login successful
        if (selectedDepartment === FINANCE_OFFICE) {
            login('finance', FINANCE_OFFICE);
        } else {
            login('department', selectedDepartment);
        }
    };

    return (
        <div className="login-page">
            <div className="login-page__card">
                <div className="login-page__header">
                    <div className="login-page__logo">🔐</div>
                    <h1 className="login-page__title">System Budżetowy</h1>
                    <p className="login-page__subtitle">Zaloguj się, aby kontynuować</p>
                </div>

                <form className="login-page__form" onSubmit={handleSubmit}>
                    <div className="login-page__field">
                        <label className="login-page__label" htmlFor="department">
                            Departament / Biuro
                        </label>
                        <select
                            id="department"
                            className="login-page__select"
                            value={selectedDepartment}
                            onChange={handleDepartmentChange}
                        >
                            <option value="">-- Wybierz --</option>
                            {allOptions.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="login-page__field">
                        <label className="login-page__label" htmlFor="email">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            className="login-page__input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@mail.com"
                        />
                    </div>

                    <div className="login-page__field">
                        <label className="login-page__label" htmlFor="password">
                            Hasło
                        </label>
                        <input
                            type="password"
                            id="password"
                            className="login-page__input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <div className="login-page__error">{error}</div>}

                    <button type="submit" className="login-page__button">
                        Zaloguj się
                    </button>
                </form>
            </div>
        </div>
    );
};
