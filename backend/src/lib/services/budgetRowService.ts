import prisma from '../prisma';
import type { WierszBudzetowyInput, WierszBudzetowyResponse, KluczRoku } from '../types/budgetRow';

// Helper: znajdź lub utwórz rekord słownikowy po kodzie
async function znajdzLubUtworzSlownik(
    model: 'czesc_budzetowa' | 'dzial' | 'rozdzial' | 'paragraf' | 'zrodlo_finansowania' | 'grupa_wydatkow',
    kod: string,
    extraData?: Record<string, unknown>
): Promise<number | null> {
    if (!kod || kod.trim() === '') return null;

    const istniejacy = await (prisma[model] as any).findFirst({
        where: model === 'grupa_wydatkow' ? { nazwa: kod } : { kod },
    });

    if (istniejacy) return istniejacy.id;

    // Twórz nowy rekord jeśli nie istnieje
    const daneDoUtworzenia = model === 'grupa_wydatkow'
        ? { nazwa: kod }
        : { kod, ...extraData };

    const utworzony = await (prisma[model] as any).create({ data: daneDoUtworzenia });
    return utworzony.id;
}

// Helper: znajdź budżet zadaniowy szczegółowy po kodzie
async function znajdzBudzetZadaniowy(kod: string): Promise<{
    szczegolowy_id: number | null;
    skrocony_id: number | null;
} | null> {
    if (!kod || kod.trim() === '') return null;

    const szczegolowy = await prisma.budzet_zadaniowy_szczegolowy.findFirst({
        where: { kod },
        include: { budzet_zadaniowy_skrocony: true },
    });

    if (szczegolowy) {
        return {
            szczegolowy_id: szczegolowy.id,
            skrocony_id: szczegolowy.budzet_skrocony_id,
        };
    }

    // Może to jest kod skrócony (XX.XX)?
    const skrocony = await prisma.budzet_zadaniowy_skrocony.findFirst({
        where: { kod },
    });

    if (skrocony) {
        return {
            szczegolowy_id: null,
            skrocony_id: skrocony.id,
        };
    }

    return null;
}

// Zapisz dane finansowe dla jednego roku
async function utworzDaneFinansowe(daneRoku: {
    rok: number;
    potrzeby: number | null;
    limit: number | null;
    zaangazowanie: number | null;
    nrUmowy: string;
}): Promise<number> {
    const utworzone = await prisma.dane_finansowe.create({
        data: {
            rok: daneRoku.rok,
            potrzeby_finansowe: daneRoku.potrzeby,
            limit_wydatkow: daneRoku.limit,
            kwota_niezabezpieczona: (daneRoku.potrzeby || 0) - (daneRoku.limit || 0),
            kwota_umowy: daneRoku.zaangazowanie,
            nr_umowy: daneRoku.nrUmowy || null,
        },
    });
    return utworzone.id;
}

// Główna funkcja: zapisz wiersz budżetowy do bazy
export async function zapiszWierszBudzetowy(dane: WierszBudzetowyInput): Promise<WierszBudzetowyResponse> {
    return await prisma.$transaction(async () => {
        // 1. Znajdź lub utwórz rekordy słownikowe
        const czescId = await znajdzLubUtworzSlownik('czesc_budzetowa', dane.czesc);
        const dzialId = await znajdzLubUtworzSlownik('dzial', dane.dzial);
        const rozdzialId = await znajdzLubUtworzSlownik('rozdzial', dane.rozdzial, { dzial_id: dzialId });
        const paragrafId = await znajdzLubUtworzSlownik('paragraf', dane.paragraf);
        const zrodloId = await znajdzLubUtworzSlownik('zrodlo_finansowania', dane.zrodloFinansowania);
        const grupaId = await znajdzLubUtworzSlownik('grupa_wydatkow', dane.grupaWydatkow);

        // 2. Znajdź budżet zadaniowy
        const budzetZadaniowy = await znajdzBudzetZadaniowy(dane.budzetZadaniowyPelny);

        // 3. Utwórz opis_zadania
        const opisZadania = await prisma.opis_zadania.create({
            data: {
                nazwa_zadania: dane.nazwaZadania,
                uzasadnienie: dane.uzasadnienie || null,
                przeznaczenie_wydatkow: dane.przeznaczenie || null,
                dotacja_partner: dane.beneficjentDotacji || null,
                dotacja_podstawa_prawna: dane.podstawaPrawnaDotacji || null,
                uwagi: dane.uwagi || null,
            },
        });

        // 4. Utwórz dane_finansowe dla każdego roku i zadanie_szczegoly
        const lata: KluczRoku[] = ['2026', '2027', '2028', '2029'];
        let zadanieSzczegolyId: number | null = null;

        for (const kluczRoku of lata) {
            const daneFinansowe = dane.daneFinansowe[kluczRoku];
            if (daneFinansowe) {
                const daneFinansoweId = await utworzDaneFinansowe(daneFinansowe);

                // Utwórz zadanie_szczegoly łączące opis z danymi finansowymi
                const zadanieSzczegoly = await prisma.zadanie_szczegoly.create({
                    data: {
                        opis_zadania_id: opisZadania.id,
                        dane_finansowe_id: daneFinansoweId,
                    },
                });

                // Użyj pierwszego jako głównego ID dla pozycja_budzetu
                if (!zadanieSzczegolyId) {
                    zadanieSzczegolyId = zadanieSzczegoly.id;
                }
            }
        }

        // 5. Utwórz pozycja_budzetu
        if (!czescId) {
            throw new Error('Część budżetowa jest wymagana');
        }

        const pozycja = await prisma.pozycja_budzetu.create({
            data: {
                czesc_budzetowa_id: czescId,
                dzial_id: dzialId,
                rozdzial_id: rozdzialId,
                paragraf_id: paragrafId,
                zrodlo_finansowania_id: zrodloId,
                grupa_wydatkow_id: grupaId,
                budzet_zadaniowy_szczegolowy_id: budzetZadaniowy?.szczegolowy_id || null,
                budzet_zadaniowy_skrocony_id: budzetZadaniowy?.skrocony_id || null,
                nazwa_programu_projektu: dane.nazwaProjektu || null,
                nazwa_komorki_organizacyjnej: dane.komorkaOrganizacyjna || null,
                plan_wi: dane.planWI || null,
                dysponent_srodkow: dane.dysponent || null,
                budzet: dane.kodBudzetu || null,
                zadanie_szczegoly_id: zadanieSzczegolyId,
            },
        });

        // 6. Utwórz formularz
        const formularz = await prisma.formularz.create({
            data: {
                pozycja_budzetu_id: pozycja.id,
                data_utworzenia: new Date(),
                status: 'draft',
            },
        });

        // Zwróć odpowiedź w formacie frontend
        return {
            ...dane,
            id: formularz.id.toString(),
            dataUtworzenia: new Date().toISOString(),
        };
    });
}

// Pobierz wszystkie wiersze budżetowe
export async function pobierzWszystkieWiersze(): Promise<WierszBudzetowyResponse[]> {
    const formularze = await prisma.formularz.findMany({
        include: {
            pozycja_budzetu: {
                include: {
                    czesc_budzetowa: true,
                    dzial: true,
                    rozdzial: true,
                    paragraf: true,
                    zrodlo_finansowania: true,
                    grupa_wydatkow: true,
                    budzet_zadaniowy_szczegolowy: {
                        include: { budzet_zadaniowy_skrocony: true },
                    },
                    budzet_zadaniowy_skrocony: true,
                    zadanie_szczegoly: {
                        include: {
                            opis_zadania: true,
                            dane_finansowe: true,
                        },
                    },
                },
            },
        },
        orderBy: { data_utworzenia: 'desc' },
    });

    return formularze.map((f) => {
        const p = f.pozycja_budzetu;
        const zs = p.zadanie_szczegoly;
        const opis = zs?.opis_zadania;

        // Zbierz dane finansowe
        const daneFinansowe: Record<KluczRoku, any> = {
            '2026': utworzPusteDaneRoku(2026),
            '2027': utworzPusteDaneRoku(2027),
            '2028': utworzPusteDaneRoku(2028),
            '2029': utworzPusteDaneRoku(2029),
        };

        if (zs?.dane_finansowe) {
            const df = zs.dane_finansowe;
            const kluczRoku = df.rok.toString() as KluczRoku;
            if (daneFinansowe[kluczRoku]) {
                daneFinansowe[kluczRoku] = {
                    rok: df.rok,
                    potrzeby: df.potrzeby_finansowe,
                    limit: df.limit_wydatkow,
                    roznica: df.kwota_niezabezpieczona || 0,
                    zaangazowanie: df.kwota_umowy,
                    nrUmowy: df.nr_umowy || '',
                };
            }
        }

        return {
            id: f.id.toString(),
            czesc: p.czesc_budzetowa?.kod || '',
            dzial: p.dzial?.kod || '',
            rozdzial: p.rozdzial?.kod || '',
            paragraf: p.paragraf?.kod || '',
            zrodloFinansowania: p.zrodlo_finansowania?.kod || '',
            grupaWydatkow: p.grupa_wydatkow?.nazwa || '',
            budzetZadaniowyPelny: p.budzet_zadaniowy_szczegolowy?.kod || p.budzet_zadaniowy_skrocony?.kod || '',
            funkcjaZadanie: p.budzet_zadaniowy_skrocony?.kod || '',
            nazwaProjektu: p.nazwa_programu_projektu || '',
            komorkaOrganizacyjna: p.nazwa_komorki_organizacyjnej || '',
            planWI: p.plan_wi || '',
            dysponent: p.dysponent_srodkow || '',
            kodBudzetu: p.budzet || '',
            nazwaZadania: opis?.nazwa_zadania || '',
            uzasadnienie: opis?.uzasadnienie || '',
            przeznaczenie: opis?.przeznaczenie_wydatkow || '',
            daneFinansowe,
            beneficjentDotacji: opis?.dotacja_partner || '',
            podstawaPrawnaDotacji: opis?.dotacja_podstawa_prawna || '',
            uwagi: opis?.uwagi || '',
            dataUtworzenia: f.data_utworzenia?.toISOString(),
        };
    });
}

function utworzPusteDaneRoku(rok: number) {
    return {
        rok,
        potrzeby: null,
        limit: null,
        roznica: 0,
        zaangazowanie: null,
        nrUmowy: '',
    };
}

// Pobierz pojedynczy wiersz po ID
export async function pobierzWierszPoId(id: number): Promise<WierszBudzetowyResponse | null> {
    const wiersze = await pobierzWszystkieWiersze();
    return wiersze.find((w) => w.id === id.toString()) || null;
}
