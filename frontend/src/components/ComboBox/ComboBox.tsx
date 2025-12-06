import React, { useState, useEffect, useRef } from 'react';
import './ComboBox.css';

interface Option {
    code: string;
    name: string;
}

interface ComboBoxProps {
    label: string;
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    warning?: string;
    required?: boolean;
}

export const ComboBox: React.FC<ComboBoxProps> = ({
    label,
    options,
    value,
    onChange,
    placeholder = 'Wybierz...',
    disabled = false,
    error,
    warning,
    required
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Find selected option to display its name when closed
    const selectedOption = options.find(opt => opt.code === value);

    useEffect(() => {
        // Close dropdown when clicking outside
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // Reset search term if not open, but keep value text logic separate
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    useEffect(() => {
        // Update search term when value changes externally (e.g. cascading reset)
        if (value && selectedOption) {
            setSearchTerm(selectedOption.name);
        } else if (!value) {
            setSearchTerm('');
        }
    }, [value, selectedOption]);

    const filteredOptions = options.filter(opt =>
        opt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opt.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleInputFocus = () => {
        if (!disabled) {
            setIsOpen(true);
            // Clear search term when opening to show all options
            setSearchTerm('');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setIsOpen(true);
        if (e.target.value === '') {
            onChange('');
        }
    };

    const handleOptionClick = (option: Option) => {
        onChange(option.code);
        setSearchTerm(option.name);
        setIsOpen(false);
    };

    return (
        <div className={`combobox-wrapper ${disabled ? 'disabled' : ''}`} ref={wrapperRef}>
            <label className="combobox-label">
                {label}
                {required && <span className="required-star">*</span>}
            </label>
            <div className="combobox-input-container">
                <input
                    type="text"
                    className={`combobox-input ${error ? 'has-error' : ''} ${warning ? 'has-warning' : ''}`}
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    placeholder={placeholder}
                    disabled={disabled}
                />
                <span className="combobox-arrow">▼</span>
            </div>

            {isOpen && !disabled && (
                <ul className="combobox-options">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <li
                                key={option.code}
                                className={`combobox-option ${option.code === value ? 'selected' : ''}`}
                                onClick={() => handleOptionClick(option)}
                            >
                                {option.name}
                            </li>
                        ))
                    ) : (
                        <li className="combobox-no-results">Brak wyników</li>
                    )}
                </ul>
            )}

            {(error || warning) && (
                <div className={`combobox-message ${error ? 'error' : 'warning'}`}>
                    {error || warning}
                </div>
            )}
        </div>
    );
};
