import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// Type definitions matching frontend WierszBudzetowy structure
interface DaneFinansoweRoku {
    potrzeby: number | null;
    limit: number | null;
    roznica: number | null;
    zaangazowanie: number | null;
    nrUmowy: string;
}

interface WierszBudzetowy {
    id: string;
    czesc: string;
    dzial: string;
    rozdzial: string;
    paragraf: string;
    zrodloFinansowania: string;
    grupaWydatkow: string;
    budzetZadaniowyPelny: string;
    funkcjaZadanie: string;
    nazwaProjektu: string;
    komorkaOrganizacyjna: string;
    planWI: string;
    dysponent: string;
    kodBudzetu: string;
    przeznaczenie: string;
    nazwaZadania: string;
    uzasadnienie: string;
    daneFinansowe: {
        '2026': DaneFinansoweRoku;
        '2027': DaneFinansoweRoku;
        '2028': DaneFinansoweRoku;
        '2029': DaneFinansoweRoku;
    };
    beneficjentDotacji: string;
    podstawaPrawnaDotacji: string;
    uwagi: string;
}

export async function POST(request: NextRequest) {
    try {
        const data: WierszBudzetowy = await request.json();

        // Lookup dictionary IDs by codes
        const czesc = await prisma.czesc_budzetowa.findUnique({
            where: { kod: data.czesc },
        });

        if (!czesc) {
            return NextResponse.json(
                { error: `Część budżetowa "${data.czesc}" nie istnieje w bazie danych. Proszę najpierw zaseedować słowniki.` },
                { status: 400 }
            );
        }

        const dzial = data.dzial ? await prisma.dzial.findUnique({
            where: { kod: data.dzial },
        }) : null;

        const rozdzial = data.rozdzial ? await prisma.rozdzial.findUnique({
            where: { kod: data.rozdzial },
        }) : null;

        const paragraf = data.paragraf ? await prisma.paragraf.findUnique({
            where: { kod: data.paragraf },
        }) : null;

        const zrodloFinansowania = data.zrodloFinansowania ? await prisma.zrodlo_finansowania.findUnique({
            where: { kod: data.zrodloFinansowania },
        }) : null;

        // Create opis_zadania
        const opisZadania = await prisma.opis_zadania.create({
            data: {
                nazwa_zadania: data.nazwaZadania,
                uzasadnienie: data.uzasadnienie,
                przeznaczenie_wydatkow: data.przeznaczenie,
                dotacja_partner: data.beneficjentDotacji,
                dotacja_podstawa_prawna: data.podstawaPrawnaDotacji,
                uwagi: data.uwagi,
            },
        });

        // Create dane_finansowe records for each year
        const daneFinansoweIds: number[] = [];
        for (const rok of ['2026', '2027', '2028', '2029'] as const) {
            const daneRoku = data.daneFinansowe[rok];
            const daneFinansowe = await prisma.dane_finansowe.create({
                data: {
                    rok: parseInt(rok),
                    potrzeby_finansowe: daneRoku.potrzeby,
                    limit_wydatkow: daneRoku.limit,
                    kwota_niezabezpieczona: daneRoku.roznica,
                    kwota_umowy: daneRoku.zaangazowanie,
                    nr_umowy: daneRoku.nrUmowy,
                },
            });
            daneFinansoweIds.push(daneFinansowe.id);
        }

        // Create zadanie_szczegoly (linking opis and dane_finansowe)
        // Note: In real schema, zadanie_szczegoly links to ONE dane_finansowe
        // We'll just use the first year's data for now as a simplified approach
        const zadanieSzczegoly = await prisma.zadanie_szczegoly.create({
            data: {
                opis_zadania_id: opisZadania.id,
                dane_finansowe_id: daneFinansoweIds[0], // Simplified: link to 2026
            },
        });

        // Create pozycja_budzetu
        const pozycjaBudzetu = await prisma.pozycja_budzetu.create({
            data: {
                zadanie_szczegoly_id: zadanieSzczegoly.id,
                czesc_budzetowa_id: czesc.id,
                dzial_id: dzial?.id,
                rozdzial_id: rozdzial?.id,
                paragraf_id: paragraf?.id,
                zrodlo_finansowania_id: zrodloFinansowania?.id,
                nazwa_programu_projektu: data.nazwaProjektu,
                nazwa_komorki_organizacyjnej: data.komorkaOrganizacyjna,
                plan_wi: data.planWI,
                dysponent_srodkow: data.dysponent,
                budzet: data.kodBudzetu,
            },
        });

        return NextResponse.json({
            success: true,
            id: pozycjaBudzetu.id,
            message: 'Pozycja budżetowa zapisana pomyślnie!',
        });

    } catch (error) {
        console.error('Error saving budget row:', error);
        return NextResponse.json(
            {
                error: 'Wystąpił błąd podczas zapisywania danych',
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
