import React from 'react';
import './FormField.css';

interface FormFieldProps {
    label: string;
    htmlFor: string;
    required?: boolean;
    error?: string;
    warning?: string;
    disabled?: boolean;
    readOnly?: boolean;
    hint?: string;
    children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
    label,
    htmlFor,
    required = false,
    error,
    warning,
    disabled = false,
    readOnly = false,
    hint,
    children
}) => {
    const fieldClass = [
        'form-field',
        error ? 'form-field--error' : '',
        warning ? 'form-field--warning' : '',
        disabled ? 'form-field--disabled' : '',
        readOnly ? 'form-field--readonly' : '',
    ].filter(Boolean).join(' ');

    return (
        <div className={fieldClass}>
            <label htmlFor={htmlFor} className="form-field__label">
                {label}
                {required && <span className="form-field__required">*</span>}
            </label>
            <div className="form-field__control">
                {children}
            </div>
            {hint && !error && !warning && (
                <span className="form-field__hint">{hint}</span>
            )}
            {error && (
                <span className="form-field__error">{error}</span>
            )}
            {warning && !error && (
                <span className="form-field__warning">{warning}</span>
            )}
        </div>
    );
};
