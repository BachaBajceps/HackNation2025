import React from 'react';
import './MinistryNotes.css';

interface MinistryNotesProps {
    departmentId: number;
    departmentName: string;
}

export const MinistryNotes: React.FC<MinistryNotesProps> = ({ departmentId: _departmentId, departmentName }) => {
    return (
        <div className="ministry-notes">
            <section className="ministry-notes__section">
                <h2 className="ministry-notes__title">
                    <span className="ministry-notes__icon">📝</span>
                    Uwagi od Ministerstwa
                </h2>
                <p className="ministry-notes__subtitle">
                    Uwagi i zalecenia dotyczące: <strong>{departmentName}</strong>
                </p>

                <div className="ministry-notes__empty">
                    <div className="ministry-notes__empty-icon">📭</div>
                    <p>Brak uwag od ministerstwa</p>
                    <span className="ministry-notes__empty-hint">
                        Uwagi pojawią się tutaj po przesłaniu przez Biuro Budżetowo-Finansowe
                    </span>
                </div>
            </section>
        </div>
    );
};
