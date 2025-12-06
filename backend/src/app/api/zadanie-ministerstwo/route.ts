import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

interface MinistryTaskRequest {
    terminWykonania: string;  // Date string
    rokBudzetu: string;      // Number as string
    kategoria: string;       // Category type
    opisKategorii: string;   // Category description/value
    wartosc: string;         // Amount as string
}

export async function POST(request: NextRequest) {
    try {
        const data: MinistryTaskRequest = await request.json();

        // Parse date and year
        const terminDo = new Date(data.terminWykonania);
        const rokBudzetu = parseInt(data.rokBudzetu);

        // Validate
        if (isNaN(terminDo.getTime())) {
            return NextResponse.json(
                { error: 'Nieprawidłowy format daty' },
                { status: 400 }
            );
        }

        if (isNaN(rokBudzetu)) {
            return NextResponse.json(
                { error: 'Nieprawidłowy rok budżetu' },
                { status: 400 }
            );
        }

        // Create constraint (ograniczenie) based on category
        const ograniczenie = await prisma.ograniczenie.create({
            data: {
                komorka_organizacyjna: data.kategoria === 'komorka' ? data.opisKategorii : null,
                dzial: data.kategoria === 'dzial' ? data.opisKategorii : null,
                rozdzial: data.kategoria === 'rozdzial' ? data.opisKategorii : null,
                paragraf: data.kategoria === 'paragraf' ? data.opisKategorii : null,
                czesc_budzetowa: data.kategoria === 'czesc' ? data.opisKategorii : null,
            },
        });

        // Parse amount
        const kwota = parseFloat(data.wartosc);

        // Create ministry task with constraint
        const zadanieMinisterstwo = await prisma.zadanie_ministerstwo.create({
            data: {
                ograniczenie_id: ograniczenie.id,
                termin_do: terminDo,
                rok_budzetu: rokBudzetu,
                kwota: isNaN(kwota) ? null : kwota,
                stan: 'nowe',
                data_utworzenia: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            id: zadanieMinisterstwo.id,
            ograniczenieId: ograniczenie.id,
            message: 'Zadanie ministerstwa zostało utworzone pomyślnie',
        });

    } catch (error) {
        console.error('Error creating ministry task:', error);
        return NextResponse.json(
            {
                error: 'Wystąpił błąd podczas zap isywania zadania',
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}

// GET endpoint to fetch ministry tasks
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const rok = searchParams.get('rok');

        const where = rok ? { rok_budzetu: parseInt(rok) } : {};

        const zadania = await prisma.zadanie_ministerstwo.findMany({
            where,
            include: {
                ograniczenie: true,
            },
            orderBy: {
                data_utworzenia: 'desc',
            },
        });

        return NextResponse.json({
            success: true,
            data: zadania,
        });

    } catch (error) {
        console.error('Error fetching ministry tasks:', error);
        return NextResponse.json(
            { error: 'Błąd pobierania zadań' },
            { status: 500 }
        );
    }
}
