import { NextRequest, NextResponse } from 'next/server';
import { zapiszWierszBudzetowy } from '../../../lib/services/budgetRowService';
import type { WierszBudzetowyInput } from '../../../lib/types/budgetRow';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as WierszBudzetowyInput;
        console.log('Using Refactored /api/budzet endpoint via Service');

        // Walidacja podstawowa
        if (!body.czesc) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Część budżetowa jest wymagana',
                },
                { status: 400 }
            );
        }

        const wynik = await zapiszWierszBudzetowy(body);

        return NextResponse.json(
            {
                success: true,
                id: wynik.id,
                message: 'Pozycja budżetowa zapisana pomyślnie!',
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Błąd podczas zapisywania wiersza:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Nieznany błąd',
            },
            { status: 500 }
        );
    }
}
