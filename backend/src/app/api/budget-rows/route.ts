import { NextRequest, NextResponse } from 'next/server';
import { zapiszWierszBudzetowy, pobierzWszystkieWiersze } from '@/lib/services/budgetRowService';
import type { WierszBudzetowyInput, OdpowiedzAPI, WierszBudzetowyResponse } from '@/lib/types/budgetRow';

// GET /api/budget-rows - Pobierz wszystkie wiersze budżetowe
export async function GET() {
    try {
        const wiersze = await pobierzWszystkieWiersze();
        return NextResponse.json<OdpowiedzAPI<WierszBudzetowyResponse[]>>({
            sukces: true,
            dane: wiersze,
        });
    } catch (error) {
        console.error('Błąd podczas pobierania wierszy:', error);
        return NextResponse.json<OdpowiedzAPI<null>>(
            {
                sukces: false,
                blad: error instanceof Error ? error.message : 'Nieznany błąd',
            },
            { status: 500 }
        );
    }
}

// POST /api/budget-rows - Zapisz nowy wiersz budżetowy
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as WierszBudzetowyInput;

        // Walidacja podstawowa
        if (!body.czesc) {
            return NextResponse.json<OdpowiedzAPI<null>>(
                {
                    sukces: false,
                    blad: 'Część budżetowa jest wymagana',
                },
                { status: 400 }
            );
        }

        const wynik = await zapiszWierszBudzetowy(body);

        return NextResponse.json<OdpowiedzAPI<WierszBudzetowyResponse>>(
            {
                sukces: true,
                dane: wynik,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Błąd podczas zapisywania wiersza:', error);
        return NextResponse.json<OdpowiedzAPI<null>>(
            {
                sukces: false,
                blad: error instanceof Error ? error.message : 'Nieznany błąd',
            },
            { status: 500 }
        );
    }
}
