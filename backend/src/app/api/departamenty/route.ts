import { NextResponse } from 'next/server';
import { pobierzWszystkieDepartamenty } from '@/lib/services/departamentService';
import type { ApiResponse, Departament } from '@/lib/types';

// GET /api/departamenty - lista departamentow
export async function GET() {
  try {
    const departamenty = pobierzWszystkieDepartamenty();

    return NextResponse.json<ApiResponse<Departament[]>>({
      success: true,
      data: departamenty
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Nieznany blad'
    }, { status: 500 });
  }
}
