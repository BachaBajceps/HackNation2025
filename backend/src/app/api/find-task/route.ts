import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { czesc, dzial, rozdzial, paragraf, komorkaOrganizacyjna } = body;

        // Find potential matches based on constraints
        // Constraints are OR-based in the requirements? Or specific?
        // User said: "task assigned if department or other constraint matches"
        // We'll search for any task that has a constraint matching ONE of the provided values
        // Prioritize by most specific?
        // Let's look for a task where `ograniczenie` matches ANY of the provided fields.

        const task = await prisma.zadanie_ministerstwo.findFirst({
            where: {
                ograniczenie: {
                    OR: [
                        { komorka_organizacyjna: komorkaOrganizacyjna || undefined },
                        { dzial: dzial || undefined },
                        { rozdzial: rozdzial || undefined },
                        { paragraf: paragraf || undefined },
                        { czesc_budzetowa: czesc || undefined }
                    ]
                }
            },
            include: {
                ograniczenie: true
            },
            orderBy: {
                data_utworzenia: 'desc'
            }
        });

        if (!task) {
            return NextResponse.json({ found: false });
        }

        // Determine which constraint matched for display
        let matchedConstraint = '';
        const ogr = task.ograniczenie;
        if (ogr?.komorka_organizacyjna === komorkaOrganizacyjna && komorkaOrganizacyjna) matchedConstraint = `Komórka: ${komorkaOrganizacyjna}`;
        else if (ogr?.dzial === dzial && dzial) matchedConstraint = `Dział: ${dzial}`;
        else if (ogr?.rozdzial === rozdzial && rozdzial) matchedConstraint = `Rozdział: ${rozdzial}`;
        else if (ogr?.paragraf === paragraf && paragraf) matchedConstraint = `Paragraf: ${paragraf}`;
        else if (ogr?.czesc_budzetowa === czesc && czesc) matchedConstraint = `Część: ${czesc}`;

        return NextResponse.json({
            found: true,
            taskId: task.id,
            description: `Zadanie z dnia ${new Date(task.data_utworzenia || '').toLocaleDateString()} (Kwota: ${task.kwota})`,
            matchedConstraint
        });

    } catch (error) {
        console.error('Error finding task:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
