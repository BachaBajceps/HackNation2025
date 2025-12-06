import { NextRequest, NextResponse } from 'next/server';
import {
  pobierzFormularz,
  aktualizujFormularz,
  usunFormularz
} from '@/lib/services/formularzService';
import { walidujPrzedWyslaniem } from '@/lib/validators/formularz';
import type { FormularzInput, ApiResponse, Formularz } from '@/lib/types';

type Params = { params: Promise<{ id: string }> };

// GET /api/formularze/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const formularz = pobierzFormularz(parseInt(id));

    if (!formularz) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Formularz nie znaleziony'
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<Formularz>>({
      success: true,
      data: formularz
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Nieznany blad'
    }, { status: 500 });
  }
}

// PUT /api/formularze/[id] - aktualizuj draft
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json() as Partial<FormularzInput>;

    const formularz = aktualizujFormularz(parseInt(id), body);

    if (!formularz) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Formularz nie znaleziony'
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<Formularz>>({
      success: true,
      data: formularz
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Nieznany blad'
    }, { status: 400 });
  }
}

// DELETE /api/formularze/[id] - usun draft
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const usunieto = usunFormularz(parseInt(id));

    if (!usunieto) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Formularz nie znaleziony lub nie mozna usunac'
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
    }, { status: 400 });
  }
}

// POST /api/formularze/[id]?action=validate - waliduj formularz (bez wysylania)
// Wysylanie pojedynczego formularza USUNIETE - uzywaj /api/wysylki/[zadanieId]/[departamentId]
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'validate') {
      const formularz = pobierzFormularz(parseInt(id));
      if (!formularz) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: 'Formularz nie znaleziony'
        }, { status: 404 });
      }

      const walidacja = walidujPrzedWyslaniem(formularz);

      return NextResponse.json<ApiResponse<{
        valid: boolean;
        bledy: string[];
        ostrzezenia: string[];
      }>>({
        success: true,
        data: walidacja
      });
    }

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Nieznana akcja. Dostepne: ?action=validate. Do wysylki uzyj /api/wysylki/[zadanieId]/[departamentId]'
    }, { status: 400 });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Nieznany blad'
    }, { status: 400 });
  }
}
