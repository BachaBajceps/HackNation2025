import { NextRequest, NextResponse } from 'next/server';
import { generujRaportZbiorczy } from '@/lib/services/raportService';
import { walidujRaportZbiorczy } from '@/lib/validators/budzet';
import type { ApiResponse, RaportZbiorczy } from '@/lib/types';

// GET /api/raporty?zadanie_id=X - raport zbiorczy dla zadania
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zadanieIdStr = searchParams.get('zadanie_id');

    if (!zadanieIdStr) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Brak parametru zadanie_id'
      }, { status: 400 });
    }

    const zadanieId = parseInt(zadanieIdStr);
    const raport = generujRaportZbiorczy(zadanieId);

    if (!raport) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Zadanie nie znalezione'
      }, { status: 404 });
    }

    // Opcjonalna walidacja raportu
    const walidacja = walidujRaportZbiorczy(zadanieId);

    return NextResponse.json<ApiResponse<RaportZbiorczy & { walidacja: typeof walidacja }>>({
      success: true,
      data: { ...raport, walidacja }
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Nieznany blad'
    }, { status: 500 });
  }
}
