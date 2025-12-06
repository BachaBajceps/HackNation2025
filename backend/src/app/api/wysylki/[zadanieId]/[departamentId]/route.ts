import { NextRequest, NextResponse } from 'next/server';
import {
  wyslijFormularzeDepartamentu,
  pobierzAktualnaWysylkeDepartamentu,
  pobierzDraftyDepartamentu,
  obliczSumyDraftow
} from '@/lib/services/wysylkaService';
import { pobierzLimitDlaDepartamentu } from '@/lib/services/zadanieService';
import type { ApiResponse, WysylkaDepartamentu, Formularz } from '@/lib/types';

type Params = { params: Promise<{ zadanieId: string; departamentId: string }> };

// GET /api/wysylki/[zadanieId]/[departamentId] - status wysylki departamentu
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { zadanieId, departamentId } = await params;
    const zId = parseInt(zadanieId);
    const dId = parseInt(departamentId);

    const wysylka = pobierzAktualnaWysylkeDepartamentu(zId, dId);
    const drafty = pobierzDraftyDepartamentu(zId, dId);
    const sumy = obliczSumyDraftow(zId, dId);
    const limit = pobierzLimitDlaDepartamentu(zId, dId);

    return NextResponse.json<ApiResponse<{
      wysylka: WysylkaDepartamentu | null;
      drafty: Formularz[];
      sumy: typeof sumy;
      limit: number;
      czy_moze_wyslac: boolean;
    }>>({
      success: true,
      data: {
        wysylka,
        drafty,
        sumy,
        limit,
        czy_moze_wyslac: drafty.length > 0 && (!wysylka || wysylka.status !== 'wyslano')
      }
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Nieznany blad'
    }, { status: 500 });
  }
}

// POST /api/wysylki/[zadanieId]/[departamentId] - wyslij wszystkie formularze departamentu
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { zadanieId, departamentId } = await params;
    const zId = parseInt(zadanieId);
    const dId = parseInt(departamentId);

    const wynik = wyslijFormularzeDepartamentu(zId, dId);

    if (!wynik.success) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Nie udalo sie wyslac formularzy',
        bledy: wynik.walidacja.bledy,
        ostrzezenia: wynik.walidacja.ostrzezenia
      }, { status: 400 });
    }

    return NextResponse.json<ApiResponse<{
      wysylka: WysylkaDepartamentu;
      ostrzezenia: string[];
    }>>({
      success: true,
      data: {
        wysylka: wynik.wysylka!,
        ostrzezenia: wynik.walidacja.ostrzezenia
      }
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Nieznany blad'
    }, { status: 500 });
  }
}
