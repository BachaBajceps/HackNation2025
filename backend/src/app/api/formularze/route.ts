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

// POST /api/formularze - utworz nowy draft
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as FormularzInput;

    const walidacja = walidujFormularzInput(body);
    if (!walidacja.valid) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Nieprawidlowe dane',
        bledy: walidacja.bledy
      }, { status: 400 });
    }

    const formularz = utworzFormularz(body);

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
