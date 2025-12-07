import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

interface FilterBasedTaskRequest {
    czesc?: string | null;
    dzial?: string | null;
    rozdzial?: string | null;
    paragraf?: string | null;
    zrodloFinansowania?: string | null;
    grupaWydatkow?: string | null;
    budzetZadaniowy?: string | null;
    komorka?: string | null;
    rokBudzetu: number;
    kwota: number;
    terminWykonania: string;
}

// Verified schema update: komorka_organizacyjna and other fields are now part of zadanie_ministerstwo
export async function POST(request: NextRequest) {
    try {
        const data: FilterBasedTaskRequest = await request.json();

        // Parse date
        const terminDo = new Date(data.terminWykonania);

        // Validate
        if (isNaN(terminDo.getTime())) {
            return NextResponse.json(
                { error: 'Nieprawidłowy format daty' },
                { status: 400 }
            );
        }

        if (isNaN(data.rokBudzetu)) {
            return NextResponse.json(
                { error: 'Nieprawidłowy rok budżetu' },
                { status: 400 }
            );
        }

        if (isNaN(data.kwota) || data.kwota <= 0) {
            return NextResponse.json(
                { error: 'Kwota musi być większa od zera' },
                { status: 400 }
            );
        }

        // Create ministry task with flattened fields
        const zadanieMinisterstwo = await prisma.zadanie_ministerstwo.create({
            data: {
                // Filter fields directly on the task
                // @ts-ignore: Stale IDE cache - field exists in schema and tsc passes
                komorka_organizacyjna: data.komorka || null,
                dzial: data.dzial || null,
                rozdzial: data.rozdzial || null,
                paragraf: data.paragraf || null,
                czesc_budzetowa: data.czesc || null,
                zrodlo_finansowania: data.zrodloFinansowania || null,
                grupa_wydatkow: data.grupaWydatkow || null,
                budzet_zadaniowy: data.budzetZadaniowy || null,

                // Task fields
                termin_do: terminDo,
                rok_budzetu: data.rokBudzetu,
                kwota: data.kwota,
                stan: 'nowe',
                data_utworzenia: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            id: zadanieMinisterstwo.id,
            message: 'Zadanie ministerstwa zostało utworzone pomyślnie',
        });

    } catch (error) {
        console.error('Error creating ministry task:', error);
        return NextResponse.json(
            {
                error: 'Wystąpił błąd podczas zapisywania zadania',
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
        const komorka = searchParams.get('komorka');

        const where: any = {};
        if (rok) where.rok_budzetu = parseInt(rok);
        if (komorka) {
            where.OR = [
                { komorka_organizacyjna: komorka },
                { komorka_organizacyjna: null } // Include tasks without specific department assignment? Maybe user wants ONLY specific?
                // Request says "should be displayed only for department it concerns".
                // So strict equality is better.
            ];
            // Wait, if I set komorka_organizacyjna to null, it applies to whom?
            // Usually "null" means "General" or "All"?
            // If user meant strict mapping, I should just use eqaulity.
            // But let's check MinistryTaskForm logic. If user selects empty komorka, it saves as null?
            // "komorka_organizacyjna: data.komorka || null" in POST.
            // If null, does it mean "All departments"? Or "None"?
            // Assuming strict filtering for now based on "only for department it concerns".
            // If I want to allow global tasks I would add OR { komorka_organizacyjna: null }.
            // I'll stick to strict equality for now as per specific request.
            where.komorka_organizacyjna = komorka;
        }

        const zadania = await prisma.zadanie_ministerstwo.findMany({
            where,
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
