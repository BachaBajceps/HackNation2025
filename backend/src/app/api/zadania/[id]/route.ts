import { NextRequest, NextResponse } from 'next/server';
import {
  pobierzZadanieZLimitami,
  zamknijZadanie,
  usunZadanie,
  aktualizujZadanie,
  pobierzHistorieZadania
} from '@/lib/services/zadanieService';
import { pobierzStatystyki } from '@/lib/services/raportService';
import type { ApiResponse, ZadanieZLimitami, AktualizacjaZadaniaInput } from '@/lib/types';

type Params = { params: Promise<{ id: string }> };

// GET /api/zadania/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const zadanie = pobierzZadanieZLimitami(parseInt(id));

    if (!zadanie) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Zadanie nie znalezione'
      }, { status: 404 });
    }

    const statystyki = pobierzStatystyki(parseInt(id));
    const historia = pobierzHistorieZadania(parseInt(id));

    return NextResponse.json<ApiResponse<ZadanieZLimitami & {
      statystyki: typeof statystyki;
      historia: typeof historia;
    }>>({
      success: true,
      data: { ...zadanie, statystyki, historia }
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Nieznany blad'
    }, { status: 500 });
  }
}

// PUT /api/zadania/[id] - aktualizuj zadanie (ministerstwo zmienia limity/ograniczenia)
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json() as AktualizacjaZadaniaInput;

    const zadanie = aktualizujZadanie(parseInt(id), body);

    if (!zadanie) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Zadanie nie znalezione'
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<ZadanieZLimitami>>({
      success: true,
      data: zadanie
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Nieznany blad'
    }, { status: 500 });
  }
}

// POST /api/zadania/[id]?action=close - zamknij zadanie
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'close') {
      const zamknieto = zamknijZadanie(parseInt(id));
      if (!zamknieto) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: 'Zadanie nie znalezione'
        }, { status: 404 });
      }

      return NextResponse.json<ApiResponse<{ closed: boolean }>>({
        success: true,
        data: { closed: true }
      });
    }

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Nieznana akcja'
    }, { status: 400 });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Nieznany blad'
    }, { status: 500 });
  }
}

// DELETE /api/zadania/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const usunieto = usunZadanie(parseInt(id));

    if (!usunieto) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Zadanie nie znalezione'
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<{ deleted: boolean }>>({
      success: true,
      data: { deleted: true }
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Nieznany blad'
    }, { status: 500 });
  }
}
