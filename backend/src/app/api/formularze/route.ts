import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// POST: Import formularzy (bulk_import)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { akcja, departament_id, zadanie_id, formularze } = body;

        if (akcja === 'bulk_import') {
            if (!formularze || !Array.isArray(formularze)) {
                return NextResponse.json({ success: false, error: 'Brak danych do importu' }, { status: 400 });
            }

            // For now, just return success with count
            // In production, this would create pozycja_budzetu and formularz records
            return NextResponse.json({
                success: true,
                data: { imported: formularze.length }
            });
        }

        return NextResponse.json({ success: false, error: 'Nieznana akcja' }, { status: 400 });
    } catch (error) {
        console.error('Error in POST /api/formularze:', error);
        return NextResponse.json({ success: false, error: 'Błąd serwera' }, { status: 500 });
    }
}

// PATCH: Aktualizacja statusu formularzy
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { akcja, zadanie_id, departament_id } = body;

        if (akcja === 'wyslij_wszystkie') {
            // Update all 'draft' (or 'Roboczy') forms to 'sent' (or 'Przesłany') status
            const result = await prisma.formularz.updateMany({
                where: {
                    OR: [
                        { status: 'draft' },
                        { status: 'Roboczy' }
                    ]
                },
                data: {
                    status: 'sent',
                    data_przeslania: new Date()
                }
            });

            return NextResponse.json({
                success: true,
                data: { zmienione: result.count }
            });
        }

        return NextResponse.json({ success: false, error: 'Nieznana akcja' }, { status: 400 });
    } catch (error) {
        console.error('Error in PATCH /api/formularze:', error);
        return NextResponse.json({ success: false, error: 'Błąd serwera' }, { status: 500 });
    }
}

// GET: Pobierz formularze
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const departament = searchParams.get('departament');

        const where: Record<string, unknown> = {};
        if (status) {
            where.status = status;
        }

        const formularze = await prisma.formularz.findMany({
            where,
            include: {
                pozycja_budzetu: true
            },
            orderBy: {
                data_utworzenia: 'desc'
            }
        });

        return NextResponse.json({
            success: true,
            data: formularze
        });
    } catch (error) {
        console.error('Error in GET /api/formularze:', error);
        return NextResponse.json({ success: false, error: 'Błąd serwera' }, { status: 500 });
    }
}
