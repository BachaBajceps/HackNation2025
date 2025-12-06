import { NextRequest, NextResponse } from 'next/server';
import { pobierzStatusDepartamentow } from '@/lib/services/wysylkaService';
import { pobierzZadanie } from '@/lib/services/zadanieService';
import type { ApiResponse, MonitoringZadania } from '@/lib/types';

// GET /api/monitoring?zadanie_id=X - monitoring statusu departamentow dla ministerstwa
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
    const zadanie = pobierzZadanie(zadanieId);

    if (!zadanie) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Zadanie nie znalezione'
      }, { status: 404 });
    }

    const statusy = pobierzStatusDepartamentow(zadanieId);

    // Filtruj tylko departamenty z limitem > 0
    const departamentyZLimitem = statusy.filter(s => s.limit > 0);

    const wyslane = departamentyZLimitem.filter(s => s.wysylka?.status === 'wyslano').length;
    const oczekujace = departamentyZLimitem.filter(s => !s.wysylka || s.wysylka.status === 'oczekuje').length;
    const wymagajaKorekty = departamentyZLimitem.filter(s => s.wysylka?.status === 'wymaga_korekty').length;

    const monitoring: MonitoringZadania = {
      zadanie,
      departamenty: departamentyZLimitem.map(s => ({
        departament: s.departament,
        limit_budzetu: s.limit,
        wysylka: s.wysylka,
        liczba_draftow: s.liczba_draftow,
        suma_draftow_rok_1: s.suma_draftow,
        czy_wyslano: s.wysylka?.status === 'wyslano',
        czy_wymaga_korekty: s.wysylka?.status === 'wymaga_korekty'
      })),
      statystyki: {
        wszystkich_departamentow: departamentyZLimitem.length,
        wyslanych: wyslane,
        oczekujacych: oczekujace,
        wymagajacych_korekty: wymagajaKorekty,
        procent_ukonczenia: departamentyZLimitem.length > 0
          ? Math.round((wyslane / departamentyZLimitem.length) * 100)
          : 0
      }
    };

    return NextResponse.json<ApiResponse<MonitoringZadania>>({
      success: true,
      data: monitoring
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Nieznany blad'
    }, { status: 500 });
  }
}
