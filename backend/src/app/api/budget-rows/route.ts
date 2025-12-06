import { NextRequest, NextResponse } from 'next/server';
import { saveBudgetRow, getAllBudgetRows } from '@/lib/services/budgetRowService';
import type { BudgetRowInput, ApiResponse, BudgetRowResponse } from '@/lib/types/budgetRow';

// GET /api/budget-rows - Pobierz wszystkie wiersze budżetowe
export async function GET() {
    try {
        const rows = await getAllBudgetRows();
        return NextResponse.json<ApiResponse<BudgetRowResponse[]>>({
            success: true,
            data: rows,
        });
    } catch (error) {
        console.error('Error fetching budget rows:', error);
        return NextResponse.json<ApiResponse<null>>(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Nieznany błąd',
            },
            { status: 500 }
        );
    }
}

// POST /api/budget-rows - Zapisz nowy wiersz budżetowy
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as BudgetRowInput;

        // Walidacja podstawowa
        if (!body.part) {
            return NextResponse.json<ApiResponse<null>>(
                {
                    success: false,
                    error: 'Część budżetowa jest wymagana',
                },
                { status: 400 }
            );
        }

        const result = await saveBudgetRow(body);

        return NextResponse.json<ApiResponse<BudgetRowResponse>>(
            {
                success: true,
                data: result,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error saving budget row:', error);
        return NextResponse.json<ApiResponse<null>>(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Nieznany błąd',
            },
            { status: 500 }
        );
    }
}
