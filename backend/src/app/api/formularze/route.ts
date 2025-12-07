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
        const { akcja, zadanie_id, departament_id, komorka } = body;

        if (akcja === 'wyslij_wszystkie') {
            // Require komorka parameter
            if (!komorka) {
                return NextResponse.json({
                    success: false,
                    error: 'Brak nazwy komórki organizacyjnej'
                }, { status: 400 });
            }

            // Get all forms for the specific department
            const allForms = await prisma.formularz.findMany({
                where: {
                    pozycja_budzetu: {
                        nazwa_komorki_organizacyjnej: komorka
                    }
                },
                include: {
                    pozycja_budzetu: {
                        include: {
                            czesc_budzetowa: true,
                            dzial: true,
                            rozdzial: true,
                            paragraf: true,
                            zrodlo_finansowania: true,
                            grupa_wydatkow: true,
                            zadanie_szczegoly: {
                                include: {
                                    dane_finansowe: true
                                }
                            }
                        }
                    },
                    zadanie_ministerstwo: true
                }
            });

            if (allForms.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: 'Brak formularzy do wysłania'
                }, { status: 400 });
            }

            // Check 1: Are there any already sent forms?
            const alreadySent = allForms.filter(f =>
                f.status === 'sent' || f.status === 'Przesłany' ||
                f.status === 'approved' || f.status === 'Zatwierdzony' ||
                f.status === 'rejected' || f.status === 'Odrzucony'
            );

            if (alreadySent.length > 0) {
                return NextResponse.json({
                    success: false,
                    error: `Nie można wysłać: ${alreadySent.length} formularz(y) zostały już przesłane lub rozpatrzone`,
                    details: {
                        juzPrzeslane: alreadySent.length
                    }
                }, { status: 400 });
            }

            // Check 2: Validate each form against constraints from zadanie_ministerstwo
            const invalidForms: { id: number; reason: string }[] = [];

            for (const form of allForms) {
                const pozycja = form.pozycja_budzetu;
                const zadanie = form.zadanie_ministerstwo;

                if (!pozycja) {
                    invalidForms.push({ id: form.id, reason: 'Brak powiązanej pozycji budżetu' });
                    continue;
                }

                // If there's a linked ministry task with constraints, validate them
                if (zadanie) {
                    // Check department constraint
                    if (zadanie.komorka_organizacyjna &&
                        pozycja.nazwa_komorki_organizacyjnej !== zadanie.komorka_organizacyjna) {
                        invalidForms.push({
                            id: form.id,
                            reason: `Niezgodna komórka organizacyjna (wymagana: ${zadanie.komorka_organizacyjna})`
                        });
                        continue;
                    }

                    // Check budget part constraint
                    if (zadanie.czesc_budzetowa &&
                        pozycja.czesc_budzetowa?.kod !== zadanie.czesc_budzetowa) {
                        invalidForms.push({
                            id: form.id,
                            reason: `Niezgodna część budżetowa (wymagana: ${zadanie.czesc_budzetowa})`
                        });
                        continue;
                    }

                    // Check section (dział) constraint
                    if (zadanie.dzial && pozycja.dzial?.kod !== zadanie.dzial) {
                        invalidForms.push({
                            id: form.id,
                            reason: `Niezgodny dział (wymagany: ${zadanie.dzial})`
                        });
                        continue;
                    }

                    // Check chapter (rozdział) constraint
                    if (zadanie.rozdzial && pozycja.rozdzial?.kod !== zadanie.rozdzial) {
                        invalidForms.push({
                            id: form.id,
                            reason: `Niezgodny rozdział (wymagany: ${zadanie.rozdzial})`
                        });
                        continue;
                    }

                    // Check paragraph constraint
                    if (zadanie.paragraf && pozycja.paragraf?.kod !== zadanie.paragraf) {
                        invalidForms.push({
                            id: form.id,
                            reason: `Niezgodny paragraf (wymagany: ${zadanie.paragraf})`
                        });
                        continue;
                    }
                }
            }

            // If any form is invalid, reject ALL
            if (invalidForms.length > 0) {
                return NextResponse.json({
                    success: false,
                    error: `Nie można wysłać: ${invalidForms.length} formularz(y) nie spełnia ograniczeń`,
                    details: {
                        niespelniajaOgraniczen: invalidForms.length,
                        bledy: invalidForms
                    }
                }, { status: 400 });
            }

            // Check 3: Validate sum of Potrzeby against kwota limit from zadanie_ministerstwo
            // Group forms by zadanie_ministerstwo and check if sum exceeds kwota
            const formsWithZadanie = allForms.filter(f => f.zadanie_ministerstwo && f.zadanie_ministerstwo.kwota);

            if (formsWithZadanie.length > 0) {
                // Calculate total potrzeby for all forms
                let totalPotrzeby = 0;
                for (const form of allForms) {
                    const daneFinansowe = form.pozycja_budzetu?.zadanie_szczegoly?.dane_finansowe;
                    if (daneFinansowe?.potrzeby_finansowe) {
                        totalPotrzeby += daneFinansowe.potrzeby_finansowe;
                    }
                }

                // Get the kwota limit from the first zadanie_ministerstwo (assuming all forms share the same task)
                const zadanie = formsWithZadanie[0].zadanie_ministerstwo;
                const kwotaLimit = zadanie?.kwota || 0;

                if (kwotaLimit > 0 && totalPotrzeby > kwotaLimit) {
                    const formatCurrency = (val: number) => val.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' });
                    return NextResponse.json({
                        success: false,
                        error: `Nie można wysłać: suma potrzeb (${formatCurrency(totalPotrzeby)}) przekracza limit (${formatCurrency(kwotaLimit)})`,
                        details: {
                            przekroczenieBudzetu: true,
                            sumaPotrzeb: totalPotrzeby,
                            limitKwoty: kwotaLimit,
                            roznica: totalPotrzeby - kwotaLimit
                        }
                    }, { status: 400 });
                }
            }

            // All validations passed - update all draft forms for this department to sent
            const draftFormIds = allForms
                .filter(f => f.status === 'draft' || f.status === 'Roboczy')
                .map(f => f.id);

            const result = await prisma.formularz.updateMany({
                where: {
                    id: { in: draftFormIds }
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

// DELETE: Usuń formularz (tylko jeśli nie został przesłany)
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const pozycjaId = searchParams.get('pozycjaId');

        if (!id && !pozycjaId) {
            return NextResponse.json({ success: false, error: 'Brak ID formularza lub pozycji' }, { status: 400 });
        }

        // Find the form first
        const formularz = await prisma.formularz.findFirst({
            where: id ? { id: parseInt(id) } : { pozycja_budzetu_id: parseInt(pozycjaId!) },
            include: { pozycja_budzetu: true }
        });

        if (!formularz) {
            return NextResponse.json({ success: false, error: 'Formularz nie znaleziony' }, { status: 404 });
        }

        // Check if form is already sent
        if (formularz.status !== 'draft' && formularz.status !== 'Roboczy') {
            return NextResponse.json({
                success: false,
                error: 'Nie można usunąć formularza, który został już przesłany lub rozpatrzony'
            }, { status: 400 });
        }

        // Delete formularz first
        await prisma.formularz.delete({
            where: { id: formularz.id }
        });

        // Also delete the pozycja_budzetu and related data
        if (formularz.pozycja_budzetu) {
            const pozycja = formularz.pozycja_budzetu;

            // Delete pozycja_budzetu
            await prisma.pozycja_budzetu.delete({
                where: { id: pozycja.id }
            });

            // Delete zadanie_szczegoly if exists
            if (pozycja.zadanie_szczegoly_id) {
                const zadanieSzczegoly = await prisma.zadanie_szczegoly.findUnique({
                    where: { id: pozycja.zadanie_szczegoly_id }
                });

                if (zadanieSzczegoly) {
                    await prisma.zadanie_szczegoly.delete({
                        where: { id: zadanieSzczegoly.id }
                    });

                    // Delete related opis_zadania and dane_finansowe
                    if (zadanieSzczegoly.opis_zadania_id) {
                        await prisma.opis_zadania.delete({
                            where: { id: zadanieSzczegoly.opis_zadania_id }
                        }).catch(() => { }); // Ignore if already deleted
                    }
                    if (zadanieSzczegoly.dane_finansowe_id) {
                        await prisma.dane_finansowe.delete({
                            where: { id: zadanieSzczegoly.dane_finansowe_id }
                        }).catch(() => { }); // Ignore if already deleted
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: { deleted: formularz.id }
        });
    } catch (error) {
        console.error('Error in DELETE /api/formularze:', error);
        return NextResponse.json({ success: false, error: 'Błąd serwera' }, { status: 500 });
    }
}
