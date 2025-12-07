import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// POST: Import formularzy (bulk_import)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { akcja, departament_id, zadanie_id, komorka, formularze } = body;

        if (akcja === 'bulk_import') {
            console.log('=== BULK IMPORT ===');
            console.log('Formularze count:', formularze?.length);
            console.log('Department ID:', departament_id);
            console.log('Komorka:', komorka);

            if (!formularze || !Array.isArray(formularze)) {
                return NextResponse.json({ success: false, error: 'Brak danych do importu' }, { status: 400 });
            }

            let imported = 0;
            const errors: Array<{ index: number, error: string }> = [];

            for (const form of formularze) {
                try {
                    // 1. Find or create czesc_budzetowa (required, use default "29" if not provided)
                    let czescBudzetowaId = 1; // Default
                    const czesc = await prisma.czesc_budzetowa.findFirst();
                    if (czesc) czescBudzetowaId = czesc.id;

                    // 2. Find rozdzial by kod and auto-fill dzial from first 3 digits
                    let rozdzialId: number | null = null;
                    let dzialId: number | null = null;

                    if (form.kod_rozdzialu) {
                        const rozdzialKod = String(form.kod_rozdzialu);
                        const rozdzial = await prisma.rozdzial.findFirst({
                            where: { kod: rozdzialKod }
                        });
                        if (rozdzial) {
                            rozdzialId = rozdzial.id;
                            // If rozdzial has dzial_id, use it
                            if (rozdzial.dzial_id) {
                                dzialId = rozdzial.dzial_id;
                            }
                        }

                        // If dzial not found via rozdzial relation, try to find by first 3 digits
                        if (!dzialId && rozdzialKod.length >= 3) {
                            const dzialKod = rozdzialKod.substring(0, 3);
                            const dzial = await prisma.dzial.findFirst({
                                where: { kod: dzialKod }
                            });
                            if (dzial) dzialId = dzial.id;
                        }
                    }

                    // 3. Find paragraf by kod
                    let paragrafId: number | null = null;
                    if (form.kod_paragrafu) {
                        const paragraf = await prisma.paragraf.findFirst({
                            where: { kod: String(form.kod_paragrafu) }
                        });
                        if (paragraf) paragrafId = paragraf.id;
                    }

                    // 4. Find zrodlo_finansowania by kod
                    let zrodloId: number | null = null;
                    if (form.zrodlo_finansowania) {
                        const zrodlo = await prisma.zrodlo_finansowania.findFirst({
                            where: { kod: String(form.zrodlo_finansowania) }
                        });
                        if (zrodlo) zrodloId = zrodlo.id;
                    }

                    // 5. Find grupa_wydatkow by nazwa
                    let grupaId: number | null = null;
                    if (form.typ_wydatku) {
                        const grupa = await prisma.grupa_wydatkow.findFirst({
                            where: { nazwa: { contains: String(form.typ_wydatku).substring(0, 20) } }
                        });
                        if (grupa) grupaId = grupa.id;
                    }

                    // 6. Create opis_zadania
                    const opisZadania = await prisma.opis_zadania.create({
                        data: {
                            nazwa_zadania: form.nazwa_zadania || 'Zadanie bez nazwy',
                            uzasadnienie: form.uzasadnienie || null
                        }
                    });

                    // 7. Create dane_finansowe
                    const daneFinansowe = await prisma.dane_finansowe.create({
                        data: {
                            rok: 2026,
                            potrzeby_finansowe: form.rok_1 || 0,
                            limit_wydatkow: null,
                            kwota_niezabezpieczona: null
                        }
                    });

                    // 8. Create zadanie_szczegoly
                    const zadanieSzczegoly = await prisma.zadanie_szczegoly.create({
                        data: {
                            opis_zadania_id: opisZadania.id,
                            dane_finansowe_id: daneFinansowe.id
                        }
                    });

                    // 9. Create pozycja_budzetu
                    const pozycjaBudzetu = await prisma.pozycja_budzetu.create({
                        data: {
                            zadanie_szczegoly_id: zadanieSzczegoly.id,
                            czesc_budzetowa_id: czescBudzetowaId,
                            dzial_id: dzialId,
                            rozdzial_id: rozdzialId,
                            paragraf_id: paragrafId,
                            zrodlo_finansowania_id: zrodloId,
                            grupa_wydatkow_id: grupaId,
                            nazwa_komorki_organizacyjnej: (form.jednostka_realizujaca && form.jednostka_realizujaca !== 'null' && form.jednostka_realizujaca !== 'undefined')
                                ? form.jednostka_realizujaca
                                : (komorka && komorka !== 'null' && komorka !== 'undefined' ? komorka : null),
                            nazwa_programu_projektu: form.nazwa_zadania || null
                        }
                    });

                    // 10. Verify zadanie_ministerstwo exists if provided
                    let validZadanieId: number | null = null;
                    if (zadanie_id) {
                        const zadanieExists = await prisma.zadanie_ministerstwo.findUnique({
                            where: { id: Number(zadanie_id) }
                        });
                        if (zadanieExists) {
                            validZadanieId = Number(zadanie_id);
                        }
                    }

                    // 11. Create formularz
                    const formularz = await prisma.formularz.create({
                        data: {
                            pozycja_budzetu_id: pozycjaBudzetu.id,
                            zadanie_ministerstwo_id: validZadanieId,
                            data_utworzenia: new Date(),
                            status: 'draft'
                        }
                    });

                    console.log(`Imported form #${imported + 1}: formularz.id=${formularz.id}, pozycja.id=${pozycjaBudzetu.id}`);
                    imported++;
                } catch (err: unknown) {
                    // Extract meaningful error message from Prisma or other errors
                    let errorMsg = 'Nieznany błąd';
                    if (err && typeof err === 'object') {
                        const e = err as Record<string, unknown>;
                        if (e.code) {
                            // Prisma error
                            errorMsg = `Prisma ${e.code}: ${e.meta ? JSON.stringify(e.meta) : 'brak szczegółów'}`;
                        } else if (e.message && typeof e.message === 'string') {
                            errorMsg = e.message;
                        } else {
                            errorMsg = JSON.stringify(err).substring(0, 200);
                        }
                    } else {
                        errorMsg = String(err);
                    }
                    console.error('Error importing form:', errorMsg);
                    console.error('Full error:', err);
                    errors.push({ index: formularze.indexOf(form), error: errorMsg });
                }
            }

            console.log(`Import complete: ${imported} successful, ${errors.length} failed`);

            // Return with error details if some imports failed
            if (errors.length > 0 && imported === 0) {
                return NextResponse.json({
                    success: false,
                    error: `Wszystkie ${errors.length} formularzy nie zostały zaimportowane`,
                    details: errors.slice(0, 5) // Show first 5 errors
                }, { status: 400 });
            }

            return NextResponse.json({
                success: true,
                data: {
                    imported,
                    failed: errors.length,
                    errors: errors.slice(0, 3) // Include some error details
                }
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
