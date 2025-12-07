import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const komorka = searchParams.get('komorka');

        // Fetch all pozycja_budzetu with related data
        const pozycje = await prisma.pozycja_budzetu.findMany({
            where: komorka ? { nazwa_komorki_organizacyjnej: komorka } : undefined,
            include: {
                czesc_budzetowa: true,
                dzial: true,
                rozdzial: true,
                paragraf: true,
                zrodlo_finansowania: true,
                grupa_wydatkow: true,
                budzet_zadaniowy_szczegolowy: true,
                budzet_zadaniowy_skrocony: true,
                zadanie_szczegoly: {
                    include: {
                        opis_zadania: true,
                        dane_finansowe: true
                    }
                },
                formularz: {
                    orderBy: { data_utworzenia: 'desc' },
                    take: 1
                }
            },
            orderBy: [
                { nazwa_komorki_organizacyjnej: 'asc' },
                { id: 'asc' }
            ]
        });

        // Transform data to flat structure for table
        const data = pozycje.map(pozycja => {
            // Get financial data from zadanie_szczegoly
            const daneFinansowe = pozycja.zadanie_szczegoly?.dane_finansowe;
            const opisZadania = pozycja.zadanie_szczegoly?.opis_zadania;

            return {
                id: pozycja.id,
                czesc: pozycja.czesc_budzetowa?.kod || '',
                dzial: pozycja.dzial?.kod || '',
                rozdzial: pozycja.rozdzial?.kod || '',
                paragraf: pozycja.paragraf?.kod || '',
                zrodloFinansowania: pozycja.zrodlo_finansowania?.kod || '',
                grupaWydatkow: pozycja.grupa_wydatkow?.nazwa || '',
                budzetZadaniowyPelny: pozycja.budzet_zadaniowy_szczegolowy?.kod || '',
                budzetZadaniowySkrocony: pozycja.budzet_zadaniowy_skrocony?.kod || '',
                nazwaProjektu: pozycja.nazwa_programu_projektu || '',
                komorkaOrganizacyjna: pozycja.nazwa_komorki_organizacyjnej || '',
                planWI: pozycja.plan_wi || '',
                dysponent: pozycja.dysponent_srodkow || '',
                kodBudzetu: pozycja.budzet || '',
                nazwaZadania: opisZadania?.nazwa_zadania || '',
                uzasadnienie: opisZadania?.uzasadnienie || '',
                przeznaczenie: opisZadania?.przeznaczenie_wydatkow || '',
                // Financial data - use linked dane_finansowe
                potrzeby2026: daneFinansowe?.rok === 2026 ? daneFinansowe.potrzeby_finansowe : null,
                limit2026: daneFinansowe?.rok === 2026 ? daneFinansowe.limit_wydatkow : null,
                roznica2026: daneFinansowe?.rok === 2026 ? daneFinansowe.kwota_niezabezpieczona : null,
                kwotaUmowy2026: daneFinansowe?.rok === 2026 ? daneFinansowe.kwota_umowy : null,
                nrUmowy2026: daneFinansowe?.rok === 2026 ? daneFinansowe.nr_umowy || '' : '',
                potrzeby2027: daneFinansowe?.rok === 2027 ? daneFinansowe.potrzeby_finansowe : null,
                limit2027: daneFinansowe?.rok === 2027 ? daneFinansowe.limit_wydatkow : null,
                roznica2027: daneFinansowe?.rok === 2027 ? daneFinansowe.kwota_niezabezpieczona : null,
                kwotaUmowy2027: daneFinansowe?.rok === 2027 ? daneFinansowe.kwota_umowy : null,
                nrUmowy2027: daneFinansowe?.rok === 2027 ? daneFinansowe.nr_umowy || '' : '',
                potrzeby2028: daneFinansowe?.rok === 2028 ? daneFinansowe.potrzeby_finansowe : null,
                limit2028: daneFinansowe?.rok === 2028 ? daneFinansowe.limit_wydatkow : null,
                roznica2028: daneFinansowe?.rok === 2028 ? daneFinansowe.kwota_niezabezpieczona : null,
                kwotaUmowy2028: daneFinansowe?.rok === 2028 ? daneFinansowe.kwota_umowy : null,
                nrUmowy2028: daneFinansowe?.rok === 2028 ? daneFinansowe.nr_umowy || '' : '',
                potrzeby2029: daneFinansowe?.rok === 2029 ? daneFinansowe.potrzeby_finansowe : null,
                limit2029: daneFinansowe?.rok === 2029 ? daneFinansowe.limit_wydatkow : null,
                roznica2029: daneFinansowe?.rok === 2029 ? daneFinansowe.kwota_niezabezpieczona : null,
                kwotaUmowy2029: daneFinansowe?.rok === 2029 ? daneFinansowe.kwota_umowy : null,
                nrUmowy2029: daneFinansowe?.rok === 2029 ? daneFinansowe.nr_umowy || '' : '',
                beneficjentDotacji: opisZadania?.dotacja_partner || '',
                podstawaPrawnaDotacji: opisZadania?.dotacja_podstawa_prawna || '',
                uwagi: opisZadania?.uwagi || '',
                // Status from linked formularz (first one, ordered by date desc)
                status: pozycja.formularz?.[0]?.status || 'brak'
            };
        });

        return NextResponse.json({
            success: true,
            data,
            count: data.length
        });

    } catch (error) {
        console.error('Error fetching budget summary:', error);
        return NextResponse.json(
            {
                error: 'Błąd pobierania zestawienia',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
