import prisma from '../prisma';
import type { BudgetRowInput, BudgetRowResponse, YearKey } from '../types/budgetRow';

// Helper: znajdź lub utwórz rekord słownikowy po kodzie
async function findOrCreateDictionary<T extends { id: number }>(
    model: 'czesc_budzetowa' | 'dzial' | 'rozdzial' | 'paragraf' | 'zrodlo_finansowania' | 'grupa_wydatkow',
    kod: string,
    extraData?: Record<string, unknown>
): Promise<number | null> {
    if (!kod || kod.trim() === '') return null;

    const existing = await (prisma[model] as any).findFirst({
        where: model === 'grupa_wydatkow' ? { nazwa: kod } : { kod },
    });

    if (existing) return existing.id;

    // Twórz nowy rekord jeśli nie istnieje
    const createData = model === 'grupa_wydatkow'
        ? { nazwa: kod }
        : { kod, ...extraData };

    const created = await (prisma[model] as any).create({ data: createData });
    return created.id;
}

// Helper: znajdź budżet zadaniowy szczegółowy po kodzie
async function findTaskBudgetDetailed(kod: string): Promise<{
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
async function createFinancialData(financialYear: {
    year: number;
    needs: number | null;
    limit: number | null;
    contractedAmount: number | null;
    contractNumber: string;
}): Promise<number> {
    const created = await prisma.dane_finansowe.create({
        data: {
            rok: financialYear.year,
            potrzeby_finansowe: financialYear.needs,
            limit_wydatkow: financialYear.limit,
            kwota_niezabezpieczona: (financialYear.needs || 0) - (financialYear.limit || 0),
            kwota_umowy: financialYear.contractedAmount,
            nr_umowy: financialYear.contractNumber || null,
        },
    });
    return created.id;
}

// Główna funkcja: zapisz BudgetRow do bazy
export async function saveBudgetRow(input: BudgetRowInput): Promise<BudgetRowResponse> {
    return await prisma.$transaction(async (tx) => {
        // 1. Znajdź lub utwórz rekordy słownikowe
        const czescId = await findOrCreateDictionary('czesc_budzetowa', input.part);
        const dzialId = await findOrCreateDictionary('dzial', input.section);
        const rozdzialId = await findOrCreateDictionary('rozdzial', input.chapter, { dzial_id: dzialId });
        const paragrafId = await findOrCreateDictionary('paragraf', input.paragraph);
        const zrodloId = await findOrCreateDictionary('zrodlo_finansowania', input.financingSource);
        const grupaId = await findOrCreateDictionary('grupa_wydatkow', input.expenditureGroup);

        // 2. Znajdź budżet zadaniowy
        const taskBudget = await findTaskBudgetDetailed(input.taskBudgetFull);

        // 3. Utwórz opis_zadania
        const opisZadania = await prisma.opis_zadania.create({
            data: {
                nazwa_zadania: input.taskName,
                uzasadnienie: input.justification || null,
                przeznaczenie_wydatkow: input.category || null,
                dotacja_partner: input.grantRecipient || null,
                dotacja_podstawa_prawna: input.grantLegalBasis || null,
                uwagi: input.comments || null,
            },
        });

        // 4. Utwórz dane_finansowe dla każdego roku i zadanie_szczegoly
        const years: YearKey[] = ['2026', '2027', '2028', '2029'];
        let zadanieSzczegolyId: number | null = null;

        for (const yearKey of years) {
            const financialData = input.financials[yearKey];
            if (financialData) {
                const daneFinansoweId = await createFinancialData(financialData);

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
                budzet_zadaniowy_szczegolowy_id: taskBudget?.szczegolowy_id || null,
                budzet_zadaniowy_skrocony_id: taskBudget?.skrocony_id || null,
                nazwa_programu_projektu: input.projectName || null,
                nazwa_komorki_organizacyjnej: input.orgUnit || null,
                plan_wi: input.planWI || null,
                dysponent_srodkow: input.disposer || null,
                budzet: input.budgetCode || null,
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
            ...input,
            id: formularz.id.toString(),
            createdAt: new Date().toISOString(),
        };
    });
}

// Pobierz wszystkie pozycje budżetu
export async function getAllBudgetRows(): Promise<BudgetRowResponse[]> {
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
        const financials: Record<YearKey, any> = {
            '2026': createEmptyFinancialYear(2026),
            '2027': createEmptyFinancialYear(2027),
            '2028': createEmptyFinancialYear(2028),
            '2029': createEmptyFinancialYear(2029),
        };

        if (zs?.dane_finansowe) {
            const df = zs.dane_finansowe;
            const yearKey = df.rok.toString() as YearKey;
            if (financials[yearKey]) {
                financials[yearKey] = {
                    year: df.rok,
                    needs: df.potrzeby_finansowe,
                    limit: df.limit_wydatkow,
                    gap: df.kwota_niezabezpieczona || 0,
                    contractedAmount: df.kwota_umowy,
                    contractNumber: df.nr_umowy || '',
                };
            }
        }

        return {
            id: f.id.toString(),
            part: p.czesc_budzetowa?.kod || '',
            section: p.dzial?.kod || '',
            chapter: p.rozdzial?.kod || '',
            paragraph: p.paragraf?.kod || '',
            financingSource: p.zrodlo_finansowania?.kod || '',
            expenditureGroup: p.grupa_wydatkow?.nazwa || '',
            taskBudgetFull: p.budzet_zadaniowy_szczegolowy?.kod || p.budzet_zadaniowy_skrocony?.kod || '',
            taskBudgetFunction: p.budzet_zadaniowy_skrocony?.kod || '',
            projectName: p.nazwa_programu_projektu || '',
            orgUnit: p.nazwa_komorki_organizacyjnej || '',
            planWI: p.plan_wi || '',
            disposer: p.dysponent_srodkow || '',
            budgetCode: p.budzet || '',
            taskName: opis?.nazwa_zadania || '',
            justification: opis?.uzasadnienie || '',
            category: opis?.przeznaczenie_wydatkow || '',
            financials,
            grantRecipient: opis?.dotacja_partner || '',
            grantLegalBasis: opis?.dotacja_podstawa_prawna || '',
            comments: opis?.uwagi || '',
            createdAt: f.data_utworzenia?.toISOString(),
        };
    });
}

function createEmptyFinancialYear(year: number) {
    return {
        year,
        needs: null,
        limit: null,
        gap: 0,
        contractedAmount: null,
        contractNumber: '',
    };
}

// Pobierz pojedynczą pozycję po ID
export async function getBudgetRowById(id: number): Promise<BudgetRowResponse | null> {
    const rows = await getAllBudgetRows();
    return rows.find((r) => r.id === id.toString()) || null;
}
