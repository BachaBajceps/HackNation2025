import { NextRequest, NextResponse } from 'next/server';
import { pobierzFormularze, utworzFormularz } from '@/lib/services/formularzService';
import { walidujFormularzInput } from '@/lib/validators/formularz';
import type { FiltryFormularzy, FormularzInput, ApiResponse, StatusFormularza } from '@/lib/types';

// GET /api/formularze - lista z filtrami
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filtry: FiltryFormularzy = {};

    if (searchParams.has('zadanie_id')) {
      filtry.zadanie_id = parseInt(searchParams.get('zadanie_id')!);
    }
    if (searchParams.has('departament_id')) {
      filtry.departament_id = parseInt(searchParams.get('departament_id')!);
    }
    if (searchParams.has('status')) {
      filtry.status = searchParams.get('status') as StatusFormularza;
    }
    if (searchParams.has('kod_rozdzialu')) {
      filtry.kod_rozdzialu = searchParams.get('kod_rozdzialu')!;
    }
    if (searchParams.has('kod_paragrafu')) {
      filtry.kod_paragrafu = searchParams.get('kod_paragrafu')!;
    }
    if (searchParams.has('kod_dzialania')) {
      filtry.kod_dzialania = searchParams.get('kod_dzialania')!;
    }
    if (searchParams.has('kategoria')) {
      filtry.kategoria = searchParams.get('kategoria')!;
    }
    if (searchParams.has('priorytet')) {
      filtry.priorytet = searchParams.get('priorytet')!;
    }
    if (searchParams.has('typ_wydatku')) {
      filtry.typ_wydatku = searchParams.get('typ_wydatku')!;
    }
    if (searchParams.has('zrodlo_finansowania')) {
      filtry.zrodlo_finansowania = searchParams.get('zrodlo_finansowania')!;
    }

    const formularze = pobierzFormularze(filtry);

    return NextResponse.json<ApiResponse<typeof formularze>>({
      success: true,
      data: formularze
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Nieznany blad'
    }, { status: 500 });
  }
}

// POST /api/formularze - utworz nowy draft lub bulk import
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Bulk import from Excel
    if (body.akcja === 'bulk_import') {
      const { departament_id, zadanie_id, formularze } = body;

      if (!departament_id || !zadanie_id || !Array.isArray(formularze)) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: 'Brak wymaganych parametrów: departament_id, zadanie_id, formularze'
        }, { status: 400 });
      }

      const { importujFormularze } = await import('@/lib/services/formularzService');
      const imported = importujFormularze(zadanie_id, departament_id, formularze);

      return NextResponse.json<ApiResponse<{ imported: number }>>({
        success: true,
        data: { imported }
      }, { status: 201 });
    }

    // Standard single form creation
    const walidacja = walidujFormularzInput(body as FormularzInput);
    if (!walidacja.valid) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Nieprawidlowe dane',
        bledy: walidacja.bledy
      }, { status: 400 });
    }

    const formularz = utworzFormularz(body as FormularzInput);

    return NextResponse.json<ApiResponse<typeof formularz>>({
      success: true,
      data: formularz
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Nieznany blad'
    }, { status: 500 });
  }
}

// PATCH /api/formularze - bulk actions (np. wyslanie wszystkich)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { akcja, zadanie_id, departament_id } = body;

    if (akcja === 'wyslij_wszystkie') {
      if (!zadanie_id || !departament_id) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: 'Brak wymaganych parametrow: zadanie_id, departament_id'
        }, { status: 400 });
      }

      // Dynamiczny import aby uniknac problemow z cyklicznymi zaleznosciami jesli by byly, 
      // chociaz tutaj to raczej kwestia wygody edycji pliku
      const { wyslijWszystkieFormularzeDepartamentu } = await import('@/lib/services/formularzService');
      const zmienione = wyslijWszystkieFormularzeDepartamentu(zadanie_id, departament_id);

      return NextResponse.json<ApiResponse<{ zmienione: number }>>({
        success: true,
        data: { zmienione }
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
