import React from 'react';
import { YearKey, FinancialYearData } from '../../types/budget';
import { formatCurrency } from '../../utils/calculations';
import './FinancialYearGrid.css';

interface FinancialYearGridProps {
    financials: Record<YearKey, FinancialYearData>;
    onUpdate: (year: YearKey, field: keyof FinancialYearData, value: number | null | string) => void;
    errors: { field: string; message: string; type: 'error' | 'warning' }[];
}

const YEARS: YearKey[] = ['2026', '2027', '2028', '2029'];

export const FinancialYearGrid: React.FC<FinancialYearGridProps> = ({
    financials,
    onUpdate,
    errors
}) => {
    const handleNumberChange = (
        year: YearKey,
        field: keyof FinancialYearData,
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = e.target.value;
        if (value === '') {
            onUpdate(year, field, null);
        } else {
            const num = parseFloat(value.replace(/,/g, '.'));
            if (!isNaN(num)) {
                onUpdate(year, field, num);
            }
        }
    };

    const handleTextChange = (
        year: YearKey,
        field: keyof FinancialYearData,
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        onUpdate(year, field, e.target.value);
    };

    const getFieldError = (year: YearKey, field: string): string | undefined => {
        const error = errors.find(e => e.field === `financials.${year}.${field}`);
        return error?.message;
    };

    const hasFieldWarning = (year: YearKey, field: string): boolean => {
        return errors.some(e => e.field === `financials.${year}.${field}` && e.type === 'warning');
    };

    const hasFieldError = (year: YearKey, field: string): boolean => {
        return errors.some(e => e.field === `financials.${year}.${field}` && e.type === 'error');
    };

    return (
        <div className="financial-grid">
            <div className="financial-grid__header">
                <div className="financial-grid__header-cell financial-grid__header-cell--label">
                    Dane finansowe
                </div>
                {YEARS.map(year => (
                    <div key={year} className="financial-grid__header-cell financial-grid__header-cell--year">
                        <span className="financial-grid__year-label">Rok {year}</span>
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
                    {YEARS.map(year => (
                        <div key={year} className="financial-grid__cell">
                            <input
                                type="text"
                                inputMode="decimal"
                                className="financial-grid__input"
                                placeholder="0,00"
                                value={financials[year].needs ?? ''}
                                onChange={(e) => handleNumberChange(year, 'needs', e)}
                            />
                        </div>
                    ))}
                </div>

                {/* Limit wydatków */}
                <div className="financial-grid__row">
                    <div className="financial-grid__cell financial-grid__cell--label">
                        Plan
                    </div>
                    {YEARS.map(year => (
                        <div key={year} className="financial-grid__cell">
                            <input
                                type="text"
                                inputMode="decimal"
                                className="financial-grid__input"
                                placeholder="0,00"
                                value={financials[year].limit ?? ''}
                                onChange={(e) => handleNumberChange(year, 'limit', e)}
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
                    {YEARS.map(year => {
                        const gap = financials[year].gap;
                        const isNegative = gap < 0;
                        const isPositive = gap > 0;
                        return (
                            <div key={year} className="financial-grid__cell">
                                <span className={`financial-grid__calculated ${isPositive ? 'financial-grid__calculated--negative' : ''} ${isNegative ? 'financial-grid__calculated--positive' : ''}`}>
                                    {formatCurrency(gap)}
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
                    {YEARS.map(year => (
                        <div
                            key={year}
                            className={`financial-grid__cell ${hasFieldWarning(year, 'contractedAmount') ? 'financial-grid__cell--warning' : ''}`}
                        >
                            <input
                                type="text"
                                inputMode="decimal"
                                className="financial-grid__input"
                                placeholder="0,00"
                                value={financials[year].contractedAmount ?? ''}
                                onChange={(e) => handleNumberChange(year, 'contractedAmount', e)}
                            />
                            {hasFieldWarning(year, 'contractedAmount') && (
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
                    {YEARS.map(year => (
                        <div
                            key={year}
                            className={`financial-grid__cell ${hasFieldError(year, 'contractNumber') ? 'financial-grid__cell--error' : ''}`}
                        >
                            <input
                                type="text"
                                className="financial-grid__input financial-grid__input--text"
                                placeholder="Nr umowy"
                                value={financials[year].contractNumber}
                                onChange={(e) => handleTextChange(year, 'contractNumber', e)}
                            />
                            {getFieldError(year, 'contractNumber') && (
                                <span className="financial-grid__error-text">{getFieldError(year, 'contractNumber')}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
