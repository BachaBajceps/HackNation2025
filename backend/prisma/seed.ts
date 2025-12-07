import prisma from '../src/lib/prisma';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Import dictionary data from frontend
const frontendDataPath = join(process.cwd(), '..', 'frontend', 'src', 'data', 'dane_formularzy');

interface DictionaryItem {
    code: string;
    name: string;
}

interface ChapterItem extends DictionaryItem {
    parentSection: string;
}

interface TaskBudgetItem extends DictionaryItem {
    level: number;
    parent?: string;
}

async function main() {
    console.log('🗑️  Clearing database...');
    // Clear in order of foreign key dependency (child tables first)
    await prisma.formularz.deleteMany();
    await prisma.zadanie_ministerstwo.deleteMany();
    await prisma.pozycja_budzetu.deleteMany();
    await prisma.zadanie_szczegoly.deleteMany();
    await prisma.dane_finansowe.deleteMany();
    await prisma.opis_zadania.deleteMany();

    await prisma.budzet_zadaniowy_szczegolowy.deleteMany();
    await prisma.budzet_zadaniowy_skrocony.deleteMany();
    await prisma.rozdzial.deleteMany();
    await prisma.dzial.deleteMany();
    await prisma.paragraf.deleteMany();
    await prisma.czesc_budzetowa.deleteMany();
    await prisma.zrodlo_finansowania.deleteMany();
    await prisma.grupa_wydatkow.deleteMany();
    console.log('✓ Database cleared');

    console.log('🌱 Starting database seed...');

    // Helper to deduplicate by code
    const deduplicate = <T extends DictionaryItem>(arr: T[]): T[] => {
        const seen = new Set();
        return arr.filter(item => {
            const duplicate = seen.has(item.code);
            seen.add(item.code);
            return !duplicate;
        });
    };

    // Load JSON data
    let parts = JSON.parse(await readFile(join(frontendDataPath, 'czesci.json'), 'utf-8')) as DictionaryItem[];
    let sections = JSON.parse(await readFile(join(frontendDataPath, 'dzialy.json'), 'utf-8')) as DictionaryItem[];
    let chapters = JSON.parse(await readFile(join(frontendDataPath, 'rozdzialy.json'), 'utf-8')) as ChapterItem[];
    let paragraphs = JSON.parse(await readFile(join(frontendDataPath, 'paragrafy.json'), 'utf-8')) as DictionaryItem[];
    const taskBudgets = JSON.parse(await readFile(join(frontendDataPath, 'zadania_budzetowe.json'), 'utf-8')) as TaskBudgetItem[];
    const departments = JSON.parse(await readFile(join(frontendDataPath, 'departamenty.json'), 'utf-8')) as DictionaryItem[];

    // Deduplicate dictionary data
    parts = deduplicate(parts);
    sections = deduplicate(sections);
    chapters = deduplicate(chapters);
    paragraphs = deduplicate(paragraphs);

    // Financing sources
    const financingSources: DictionaryItem[] = [
        { code: '0', name: 'Budżet państwa' },
        { code: '1', name: 'Środki z Unii Europejskiej (EFRR)' },
        { code: '2', name: 'Środki z Unii Europejskiej (EFS)' },
        { code: '3', name: 'Środki z Unii Europejskiej (FS)' },
        { code: '4', name: 'Środki z Unii Europejskiej (KPO)' },
        { code: '5', name: 'Środki ze źródeł zagranicznych niepodlegające zwrotowi' },
        { code: '6', name: 'Środki ze źródeł zagranicznych podlegające zwrotowi' },
        { code: '7', name: 'Środki Funduszu Pomocy' },
        { code: '8', name: 'Środki własne jednostek' },
        { code: '9', name: 'Inne źródła' },
    ];

    // Seed Dictionaries
    console.log('📋 Seeding dictionaries...');

    // Parts
    // Using transaction for faster inserts
    await prisma.$transaction(
        parts.map(p => prisma.czesc_budzetowa.create({ data: { kod: p.code, nazwa: p.name } }))
    );
    console.log(`✓ Seeded ${parts.length} parts`);

    // Sections
    await prisma.$transaction(
        sections.map(s => prisma.dzial.create({ data: { kod: s.code, nazwa: s.name } }))
    );
    console.log(`✓ Seeded ${sections.length} sections`);

    // Chapters
    for (const chapter of chapters) {
        const parentDzial = await prisma.dzial.findUnique({ where: { kod: chapter.parentSection } });
        if (parentDzial) {
            await prisma.rozdzial.create({
                data: { kod: chapter.code, nazwa: chapter.name, dzial_id: parentDzial.id }
            });
        }
    }
    console.log(`✓ Seeded ${chapters.length} chapters`);

    // Paragraphs
    await prisma.$transaction(
        paragraphs.map(p => prisma.paragraf.create({ data: { kod: p.code, nazwa: p.name } }))
    );
    console.log(`✓ Seeded ${paragraphs.length} paragraphs`);

    // Sources
    await prisma.$transaction(
        financingSources.map(s => prisma.zrodlo_finansowania.create({ data: { kod: s.code, nazwa: s.name } }))
    );
    console.log(`✓ Seeded ${financingSources.length} financing sources`);

    // Task Budgets
    const shortBudgets = new Map<string, TaskBudgetItem>();
    const detailedBudgets: TaskBudgetItem[] = [];
    for (const task of taskBudgets) {
        const parts = task.code.split('.');
        if (parts.length >= 2) {
            const shortCode = `${parts[0]}.${parts[1]}`;
            if (!shortBudgets.has(shortCode)) {
                shortBudgets.set(shortCode, { code: shortCode, name: task.name, level: 2 });
            }
            if (parts.length === 4) detailedBudgets.push(task);
        }
    }

    // Seed Short Budgets
    for (const [code, budget] of shortBudgets) {
        const parts = code.split('.');
        await prisma.budzet_zadaniowy_skrocony.create({
            data: { kod: code, funkcja: parts[0], zadanie: parts[1], nazwa: budget.name }
        });
    }

    // Seed Detailed Budgets
    for (const task of detailedBudgets) {
        const parts = task.code.split('.');
        const shortCode = `${parts[0]}.${parts[1]}`;
        const shortBudget = await prisma.budzet_zadaniowy_skrocony.findUnique({ where: { kod: shortCode } });
        if (shortBudget) {
            await prisma.budzet_zadaniowy_szczegolowy.create({
                data: {
                    kod: task.code,
                    podzadanie: parts[2],
                    dzialanie: parts[3],
                    nazwa: task.name,
                    budzet_skrocony_id: shortBudget.id,
                }
            });
        }
    }
    console.log(`✓ Seeded Task Budgets`);

    // Expenditure Groups
    const expenditureGroups = ['Wydatki bieżące', 'Wydatki majątkowe', 'Wydatki na obsługę długu'];
    await prisma.$transaction(
        expenditureGroups.map(g => prisma.grupa_wydatkow.create({ data: { nazwa: g } }))
    );
    // --- LOGICAL DATA GENERATION ---
    console.log('🏗️  Building logical data structures with VALID SCENARIOS...');

    // Helpers
    const getCode = (code: string, arr: any[]) => arr.find(x => x.kod === code)?.id;

    // SCENARIO 1: IT Department Infrastructure Upgrade
    // Task Definition
    console.log('🔹 Scenario 1: IT Department - Infrastructure Upgrade');
    const deptIT = departments.find(d => d.name === 'Departament Informatyzacji');
    if (deptIT) {
        // 1. Create Ministry Task
        const taskIT = await prisma.zadanie_ministerstwo.create({
            data: {
                komorka_organizacyjna: deptIT.name,
                czesc_budzetowa: '19', // Budżet, finanse publiczne... (Example)
                dzial: '750', // Administracja publiczna
                rozdzial: '75020', // Starostwa powiatowe (Example valid chapter)
                paragraf: '4210', // Zakup materiałów i wyposażenia
                kwota: 2500000,
                stan: 'Zatwierdzone',
                rok_budzetu: 2025,
                termin_do: new Date('2025-11-30'),
                data_utworzenia: new Date(),
                zrodlo_finansowania: '0', // Budżet państwa
                grupa_wydatkow: 'Wydatki bieżące'
            }
        });

        // 2. Create Budget Positions matching the task
        const positionsIT = [
            { name: 'Zakup serwerów Dell PowerEdge', kwota: 1200000 },
            { name: 'Licencje Oracle Database', kwota: 800000 },
            { name: 'Modernizacja okablowania LAN', kwota: 300000 }
        ];

        for (const pos of positionsIT) {
            // Find IDs
            const dzialId = await prisma.dzial.findUnique({ where: { kod: '750' } });
            const rozdzialId = await prisma.rozdzial.findUnique({ where: { kod: '75020' } });
            const paragrafId = await prisma.paragraf.findUnique({ where: { kod: '4210' } });
            const zrodloId = await prisma.zrodlo_finansowania.findUnique({ where: { kod: '0' } });
            const grupaId = await prisma.grupa_wydatkow.findFirst({ where: { nazwa: 'Wydatki bieżące' } });
            const czescId = await prisma.czesc_budzetowa.findUnique({ where: { kod: '19' } });


            if (dzialId && rozdzialId && paragrafId && zrodloId && grupaId && czescId) {
                // Details
                const desc = await prisma.opis_zadania.create({
                    data: {
                        nazwa_zadania: pos.name,
                        uzasadnienie: 'Zgodnie z planem modernizacji 2025',
                        przeznaczenie_wydatkow: 'Infrastruktura IT'
                    }
                });
                const fin = await prisma.dane_finansowe.create({
                    data: {
                        rok: 2025,
                        potrzeby_finansowe: pos.kwota,
                        limit_wydatkow: pos.kwota,
                        kwota_niezabezpieczona: 0
                    }
                });
                const detail = await prisma.zadanie_szczegoly.create({
                    data: { opis_zadania_id: desc.id, dane_finansowe_id: fin.id }
                });

                // Position
                const pozycja = await prisma.pozycja_budzetu.create({
                    data: {
                        zadanie_szczegoly_id: detail.id,
                        czesc_budzetowa_id: czescId.id,
                        dzial_id: dzialId.id,
                        rozdzial_id: rozdzialId.id,
                        paragraf_id: paragrafId.id,
                        zrodlo_finansowania_id: zrodloId.id,
                        grupa_wydatkow_id: grupaId.id,
                        nazwa_komorki_organizacyjnej: deptIT.name,
                        dysponent_srodkow: deptIT.name,
                        budzet: '2025',
                        plan_wi: '0'
                    }
                });

                // Link to Task (Formularz)
                await prisma.formularz.create({
                    data: {
                        pozycja_budzetu_id: pozycja.id,
                        zadanie_ministerstwo_id: taskIT.id,
                        status: 'Przesłany',
                        data_utworzenia: new Date(),
                        rok_1: pos.kwota
                    }
                });
            }
        }
    }

    // SCENARIO 2: HR Department Training
    console.log('🔹 Scenario 2: HR Department - Soft Skills Training');
    const deptHR = departments.find(d => d.name === 'Departament Kadr i Szkoleń'); // Adjust name if needed from JSON
    // Checking JSON path... let's assume 'Departament Kadr' if exists, or just pick first available if not found specific
    const targetDeptName = deptHR ? deptHR.name : departments[1]?.name; // Fallback

    if (targetDeptName) {
        const taskHR = await prisma.zadanie_ministerstwo.create({
            data: {
                komorka_organizacyjna: targetDeptName,
                czesc_budzetowa: '19',
                dzial: '750',
                rozdzial: '75020',
                paragraf: '4300', // Zakup usług pozostałych
                kwota: 150000,
                stan: 'W przygotowaniu',
                rok_budzetu: 2025,
                termin_do: new Date('2025-06-30'),
                data_utworzenia: new Date(),
                zrodlo_finansowania: '0',
                grupa_wydatkow: 'Wydatki bieżące'
            }
        });

        // Create one matching position
        const positionsHR = [{ name: 'Szkolenia miękkie dla kadry zarządzającej', kwota: 50000 }];

        const paragraf4300 = await prisma.paragraf.findUnique({ where: { kod: '4300' } });

        if (paragraf4300) {
            for (const pos of positionsHR) {
                // Details creation simplified...
                const desc = await prisma.opis_zadania.create({
                    data: { nazwa_zadania: pos.name, uzasadnienie: 'Podnoszenie kwalifikacji', przeznaczenie_wydatkow: 'Szkolenia' }
                });
                const fin = await prisma.dane_finansowe.create({
                    data: { rok: 2025, potrzeby_finansowe: pos.kwota, limit_wydatkow: pos.kwota, kwota_niezabezpieczona: 0 }
                });
                const detail = await prisma.zadanie_szczegoly.create({
                    data: { opis_zadania_id: desc.id, dane_finansowe_id: fin.id }
                });

                // Helper to find ID safely? Using previous vars
                const dzialId = await prisma.dzial.findUnique({ where: { kod: '750' } });
                const rozdzialId = await prisma.rozdzial.findUnique({ where: { kod: '75020' } });
                const zrodloId = await prisma.zrodlo_finansowania.findUnique({ where: { kod: '0' } });
                const grupaId = await prisma.grupa_wydatkow.findFirst({ where: { nazwa: 'Wydatki bieżące' } });
                const czescId = await prisma.czesc_budzetowa.findUnique({ where: { kod: '19' } });

                if (dzialId && rozdzialId && zrodloId && grupaId && czescId) {
                    const pozycja = await prisma.pozycja_budzetu.create({
                        data: {
                            zadanie_szczegoly_id: detail.id,
                            czesc_budzetowa_id: czescId.id,
                            dzial_id: dzialId.id,
                            rozdzial_id: rozdzialId.id,
                            paragraf_id: paragraf4300.id,
                            zrodlo_finansowania_id: zrodloId.id,
                            grupa_wydatkow_id: grupaId.id,
                            nazwa_komorki_organizacyjnej: targetDeptName,
                            dysponent_srodkow: targetDeptName,
                            budzet: '2025',
                            plan_wi: '0'
                        }
                    });

                    // Link
                    await prisma.formularz.create({
                        data: {
                            pozycja_budzetu_id: pozycja.id,
                            zadanie_ministerstwo_id: taskHR.id,
                            status: 'Roboczy',
                            data_utworzenia: new Date(),
                            rok_1: pos.kwota
                        }
                    });
                }
            }
        }
    }


    console.log('✅ Full database seeding completed successfully with REALISTIC scenarios!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
