
import React, { useState, useEffect } from 'react';

interface Limit {
    id: number;
    rokBudzetowy: number;
    kodDepartamentu: string;
    dzialKod: string;
    rozdzialKod: string;
    grupaWydatkow: string;
    kwota: number;
}

const DEPARTAMENTY = [
    { kod: 'DA', nazwa: 'Departament Administracji' },
    { kod: 'DI', nazwa: 'Departament Informatyki' },
    { kod: 'DF', nazwa: 'Departament Finansów' },
    { kod: 'DK', nazwa: 'Departament Komunikacji' }
];

const GRUPY_WYDATKOW = [
    'dotacje i subwencje',
    'świadczenia na rzecz osób fizycznych',
    'wydatki bieżące jednostek budżetowych',
    'wydatki majątkowe',
    'obsługa długu',
    'środki własne UE'
];

export const LimitsManager: React.FC = () => {
    const [limits, setLimits] = useState<Limit[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [rok, setRok] = useState(2026);
    const [dept, setDept] = useState(DEPARTAMENTY[0].kod);
    const [dzial, setDzial] = useState('750');
    const [rozdzial, setRozdzial] = useState('75001');
    const [grupa, setGrupa] = useState(GRUPY_WYDATKOW[0]);
    const [kwota, setKwota] = useState(1000);

    const fetchLimits = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/limits?rok=${rok}`);
            const data = await res.json();
            if (data.sukces) {
                setLimits(data.dane || []);
            }
        } catch (error) {
            console.error("Failed to fetch limits", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLimits();
    }, [rok]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/limits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rokBudzetowy: Number(rok),
                    kodDepartamentu: dept,
                    dzialKod: dzial,
                    rozdzialKod: rozdzial,
                    grupaWydatkow: grupa,
                    kwota: Number(kwota)
                })
            });
            const data = await res.json();
            if (data.sukces) {
                alert('Limit zapisany!');
                fetchLimits();
            } else {
                alert('Błąd: ' + data.blad);
            }
        } catch (error) {
            console.error(error);
            alert('Wystąpił błąd komunikacji');
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2>Zarządzanie Limitami Wydatków</h2>

            <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                <h3>Dodaj / Edytuj Limit</h3>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <label>
                        Rok Budżetowy:
                        <input type="number" value={rok} onChange={e => setRok(Number(e.target.value))} style={{ display: 'block', width: '100%' }} />
                    </label>
                    <label>
                        Departament:
                        <select value={dept} onChange={e => setDept(e.target.value)} style={{ display: 'block', width: '100%' }}>
                            {DEPARTAMENTY.map(d => <option key={d.kod} value={d.kod}>{d.nazwa} ({d.kod})</option>)}
                        </select>
                    </label>
                    <label>
                        Dział:
                        <input type="text" value={dzial} onChange={e => setDzial(e.target.value)} style={{ display: 'block', width: '100%' }} />
                    </label>
                    <label>
                        Rozdział:
                        <input type="text" value={rozdzial} onChange={e => setRozdzial(e.target.value)} style={{ display: 'block', width: '100%' }} />
                    </label>
                    <label>
                        Grupa Wydatków:
                        <select value={grupa} onChange={e => setGrupa(e.target.value)} style={{ display: 'block', width: '100%' }}>
                            {GRUPY_WYDATKOW.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </label>
                    <label>
                        Kwota (PLN):
                        <input type="number" value={kwota} onChange={e => setKwota(Number(e.target.value))} style={{ display: 'block', width: '100%' }} />
                    </label>
                    <button type="submit" style={{ gridColumn: '1 / -1', padding: '0.5rem', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
                        Zapisz Limit
                    </button>
                </form>
            </div>

            <h3>Aktualne Limity ({rok})</h3>
            {loading ? <p>Ładowanie...</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                    <thead>
                        <tr style={{ background: '#eee', textAlign: 'left' }}>
                            <th style={{ padding: '0.5rem' }}>Departament</th>
                            <th style={{ padding: '0.5rem' }}>Klasyfikacja (Dz/Rozdz/Gr)</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Kwota</th>
                        </tr>
                    </thead>
                    <tbody>
                        {limits.map(l => (
                            <tr key={l.id} style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '0.5rem' }}>{DEPARTAMENTY.find(d => d.kod === l.kodDepartamentu)?.nazwa || l.kodDepartamentu}</td>
                                <td style={{ padding: '0.5rem' }}>{l.dzialKod} / {l.rozdzialKod} / {l.grupaWydatkow}</td>
                                <td style={{ padding: '0.5rem', textAlign: 'right' }}>{l.kwota.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}</td>
                            </tr>
                        ))}
                        {limits.length === 0 && <tr><td colSpan={3} style={{ padding: '1rem', textAlign: 'center' }}>Brak zdefiniowanych limitów.</td></tr>}
                    </tbody>
                </table>
            )}
        </div>
    );
};
