import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { ApiResponse, WysylkaZDepartamentem } from '@/lib/types';

// GET /api/wysylki?zadanie_id=X - lista wysylek dla zadania
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

    const db = getDb();
    const wysylki = db.prepare(`
      SELECT w.*, d.nazwa as dep_nazwa, d.kod as dep_kod
      FROM wysylki_departamentow w
      JOIN departamenty d ON d.id = w.departament_id
      WHERE w.zadanie_id = ?
      ORDER BY w.created_at DESC
    `).all(parseInt(zadanieIdStr)) as (WysylkaZDepartamentem & { dep_nazwa: string; dep_kod: string })[];

    const wyniki = wysylki.map(w => ({
      ...w,
      departament: { id: w.departament_id, nazwa: w.dep_nazwa, kod: w.dep_kod }
    }));

    return NextResponse.json<ApiResponse<typeof wyniki>>({
      success: true,
      data: wyniki
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Nieznany blad'
    }, { status: 500 });
  }
}
