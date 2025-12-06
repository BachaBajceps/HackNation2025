import { NextRequest, NextResponse } from 'next/server';
import { pobierzWszystkieZadania, utworzZadanie } from '@/lib/services/zadanieService';
import type { ApiResponse, Zadanie, ZadanieZLimitami, StatusZadania, NoweZadanieInput } from '@/lib/types';

// GET /api/zadania - lista zadan
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as StatusZadania | null;

    const zadania = pobierzWszystkieZadania(status ?? undefined);

    return NextResponse.json<ApiResponse<Zadanie[]>>({
      success: true,
      data: zadania
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Nieznany blad'
    }, { status: 500 });
  }
}

// POST /api/zadania - utworz nowe zadanie z limitami i ograniczeniami (ministerstwo)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as NoweZadanieInput;

    if (!body.tytul || !body.termin_do) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Brak wymaganych pol: tytul, termin_do'
      }, { status: 400 });
    }

    const zadanie = utworzZadanie({
      tytul: body.tytul,
      opis: body.opis,
      termin_do: body.termin_do,
      limity: body.limity || [],
      ograniczenia: body.ograniczenia || []
    });

    return NextResponse.json<ApiResponse<ZadanieZLimitami>>({
      success: true,
      data: zadanie
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Nieznany blad'
    }, { status: 500 });
  }
}
