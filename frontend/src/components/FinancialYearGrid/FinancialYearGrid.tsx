import React from 'react';
import { KluczRoku, DaneFinansoweRoku } from '../../types/budget';
import { formatCurrency } from '../../utils/calculations';
import './FinancialYearGrid.css';

interface FinancialYearGridProps {
    daneFinansowe: Record<KluczRoku, DaneFinansoweRoku>;
    onUpdate: (rok: KluczRoku, pole: keyof DaneFinansoweRoku, wartosc: number | null | string) => void;
    errors: { field: string; message: string; type: 'error' | 'warning' }[];
}

const LATA: KluczRoku[] = ['2026', '2027', '2028', '2029'];

export const FinancialYearGrid: React.FC<FinancialYearGridProps> = ({
    daneFinansowe,
    onUpdate,
    errors
}) => {
    const handleNumberChange = (
        rok: KluczRoku,
        pole: keyof DaneFinansoweRoku,
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = e.target.value;
        if (value === '') {
            onUpdate(rok, pole, null);
        } else {
            const num = parseFloat(value.replace(/,/g, '.'));
            if (!isNaN(num)) {
                onUpdate(rok, pole, num);
            }
        }
    };

    const handleTextChange = (
        rok: KluczRoku,
        pole: keyof DaneFinansoweRoku,
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        onUpdate(rok, pole, e.target.value);
    };

    const getFieldError = (rok: KluczRoku, pole: string): string | undefined => {
        const error = errors.find(e => e.field === `daneFinansowe.${rok}.${pole}`);
        return error?.message;
    };

    const hasFieldWarning = (rok: KluczRoku, pole: string): boolean => {
        return errors.some(e => e.field === `daneFinansowe.${rok}.${pole}` && e.type === 'warning');
    };

    const hasFieldError = (rok: KluczRoku, pole: string): boolean => {
        return errors.some(e => e.field === `daneFinansowe.${rok}.${pole}` && e.type === 'error');
    };

    return (
        <div className="financial-grid">
            <div className="financial-grid__header">
                <div className="financial-grid__header-cell financial-grid__header-cell--label">
                    Dane finansowe
                </div>
                {LATA.map(rok => (
                    <div key={rok} className="financial-grid__header-cell financial-grid__header-cell--year">
                        <span className="financial-grid__year-label">Rok {rok}</span>
                    </div>
                ))}
            </div>

            <div className="financial-grid__body">
                {/* Potrzeby finansowe */}
                <div className="financial-grid__row">
                    <div className="financial-grid__cell financial-grid__cell--label">
                        Potrzeby
                        <span className="financial-grid__required">*</span>
                    </div>
                    {LATA.map(rok => (
                        <div key={rok} className="financial-grid__cell">
                            <input
                                type="text"
                                inputMode="decimal"
                                className="financial-grid__input"
                                placeholder="0,00"
                                value={daneFinansowe[rok].potrzeby ?? ''}
                                onChange={(e) => handleNumberChange(rok, 'potrzeby', e)}
                            />
                        </div>
                    ))}
                </div>

                {/* Limit wydatków */}
                <div className="financial-grid__row">
                    <div className="financial-grid__cell financial-grid__cell--label">
                        Plan
                    </div>
                    {LATA.map(rok => (
                        <div key={rok} className="financial-grid__cell">
                            <input
                                type="text"
                                inputMode="decimal"
                                className="financial-grid__input"
                                placeholder="0,00"
                                value={daneFinansowe[rok].limit ?? ''}
                                onChange={(e) => handleNumberChange(rok, 'limit', e)}
                            />
                        </div>
                    ))}
                </div>

                {/* Braki (Gap) - obliczane automatycznie */}
                <div className="financial-grid__row financial-grid__row--calculated">
                    <div className="financial-grid__cell financial-grid__cell--label">
                        Różnica
                        <span className="financial-grid__hint">(automatyczne)</span>
                    </div>
                    {LATA.map(rok => {
                        const roznica = daneFinansowe[rok].roznica;
                        const isNegative = roznica < 0;
                        const isPositive = roznica > 0;
                        return (
                            <div key={rok} className="financial-grid__cell">
                                <span className={`financial-grid__calculated ${isPositive ? 'financial-grid__calculated--negative' : ''} ${isNegative ? 'financial-grid__calculated--positive' : ''}`}>
                                    {formatCurrency(roznica)}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Kwota zaangażowana */}
                <div className="financial-grid__row">
                    <div className="financial-grid__cell financial-grid__cell--label">
                        Kwota zawartych umów
                    </div>
                    {LATA.map(rok => (
                        <div
                            key={rok}
                            className={`financial-grid__cell ${hasFieldWarning(rok, 'zaangazowanie') ? 'financial-grid__cell--warning' : ''}`}
                        >
                            <input
                                type="text"
                                inputMode="decimal"
                                className="financial-grid__input"
                                placeholder="0,00"
                                value={daneFinansowe[rok].zaangazowanie ?? ''}
                                onChange={(e) => handleNumberChange(rok, 'zaangazowanie', e)}
                            />
                            {hasFieldWarning(rok, 'zaangazowanie') && (
                                <span className="financial-grid__warning-icon" title="Przekracza limit">⚠</span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Nr umowy */}
                <div className="financial-grid__row">
                    <div className="financial-grid__cell financial-grid__cell--label">
                        Nr umowy/nr wniosku o udzielenie zamówienia publicznego
                    </div>
                    {LATA.map(rok => (
                        <div
                            key={rok}
                            className={`financial-grid__cell ${hasFieldError(rok, 'nrUmowy') ? 'financial-grid__cell--error' : ''}`}
                        >
                            <input
                                type="text"
                                className="financial-grid__input financial-grid__input--text"
                                placeholder="Nr umowy"
                                value={daneFinansowe[rok].nrUmowy}
                                onChange={(e) => handleTextChange(rok, 'nrUmowy', e)}
                            />
                            {getFieldError(rok, 'nrUmowy') && (
                                <span className="financial-grid__error-text">{getFieldError(rok, 'nrUmowy')}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
