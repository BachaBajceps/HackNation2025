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
    await prisma.ograniczenie.deleteMany();
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
    console.log(`✓ Seeded expenditure groups`);


    // --- LOGICAL DATA GENERATION ---
    console.log('🏗️  Building logical data structures...');

    const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Fetch IDs
    const allDetailTasks = await prisma.budzet_zadaniowy_szczegolowy.findMany();
    const allChapters = await prisma.rozdzial.findMany({ include: { dzial: true } });
    const allParagraphs = await prisma.paragraf.findMany();
    const allSources = await prisma.zrodlo_finansowania.findMany();
    const allParts = await prisma.czesc_budzetowa.findMany();
    const allGroups = await prisma.grupa_wydatkow.findMany();

    // 1. Seed `opis_zadania` and `dane_finansowe` linked to `zadanie_szczegoly`
    const generatedDetailsIds: number[] = [];
    const TASKS_COUNT = 100;

    console.log('📋 Seeding details (opis & finanse)...');
    for (let i = 0; i < TASKS_COUNT; i++) {
        const desc = await prisma.opis_zadania.create({
            data: {
                nazwa_zadania: `Zadanie inwestycyjne nr ${i + 1}: Modernizacja infrastruktury`,
                uzasadnienie: 'Konieczność dostosowania do nowych wymogów bezpieczeństwa...',
                przeznaczenie_wydatkow: 'Zakup materiałów budowlanych oraz usługi remontowe.',
                dotacja_partner: Math.random() > 0.8 ? 'Partnerstwo Publiczno-Prywatne' : null,
                uwagi: Math.random() > 0.9 ? 'Wymaga pilnej realizacji' : null
            }
        });

        const fin = await prisma.dane_finansowe.create({
            data: {
                rok: 2025,
                potrzeby_finansowe: parseFloat((Math.random() * 1000000).toFixed(2)),
                limit_wydatkow: parseFloat((Math.random() * 800000).toFixed(2)),
                kwota_niezabezpieczona: parseFloat((Math.random() * 200000).toFixed(2)),
                kwota_umowy: Math.random() > 0.5 ? parseFloat((Math.random() * 500000).toFixed(2)) : null,
                nr_umowy: Math.random() > 0.5 ? `UM/${2024}/${i}` : null
            }
        });

        const detail = await prisma.zadanie_szczegoly.create({
            data: {
                opis_zadania_id: desc.id,
                dane_finansowe_id: fin.id
            }
        });
        generatedDetailsIds.push(detail.id);
    }

    // 2. Seed `ograniczenie` using departments
    console.log('📋 Seeding ograniczenia (restrictions)...');
    const restrictionsIds: number[] = [];
    for (const dept of departments) {
        const restr = await prisma.ograniczenie.create({
            data: {
                komorka_organizacyjna: dept.name, // Using actual department names
                czesc_budzetowa: getRandom(allParts).kod, // Example constraint
            }
        });
        restrictionsIds.push(restr.id);
    }

    // 3. Seed `zadanie_ministerstwo`
    console.log('📋 Seeding zadania ministerstwa...');
    const minTasksIds: number[] = [];
    for (let i = 0; i < 20; i++) {
        const t = await prisma.zadanie_ministerstwo.create({
            data: {
                ograniczenie_id: getRandom(restrictionsIds),
                kwota: parseFloat((Math.random() * 5000000).toFixed(2)),
                stan: ['W przygotowaniu', 'Zatwierdzone', 'Odrzucone'][getRandomInt(0, 2)],
                data_utworzenia: new Date(),
                termin_do: new Date('2025-12-31'),
                rok_budzetu: 2025
            }
        });
        minTasksIds.push(t.id);
    }

    // 4. Seed `pozycja_budzetu`
    console.log('📋 Seeding pozycje budzetu...');
    const positionsIds: number[] = [];
    for (let i = 0; i < 150; i++) {
        const chapter = getRandom(allChapters);
        const detailId = getRandom(generatedDetailsIds);

        const pos = await prisma.pozycja_budzetu.create({
            data: {
                zadanie_szczegoly_id: detailId,
                czesc_budzetowa_id: getRandom(allParts).id,
                dzial_id: chapter.dzial_id,
                rozdzial_id: chapter.id,
                paragraf_id: getRandom(allParagraphs).id,
                zrodlo_finansowania_id: getRandom(allSources).id,
                grupa_wydatkow_id: getRandom(allGroups).id,
                budzet_zadaniowy_szczegolowy_id: getRandom(allDetailTasks).id,
                nazwa_programu_projektu: Math.random() > 0.8 ? `Projekt UE ${i}` : null,
                nazwa_komorki_organizacyjnej: getRandom(departments).name,
                dysponent_srodkow: getRandom(departments).name,
                budzet: '2025',
                plan_wi: (Math.random() * 50000).toFixed(2)
            }
        });
        positionsIds.push(pos.id);
    }

    // 5. Seed `formularz` linking Positions to Ministry Tasks
    console.log('📋 Seeding formularze...');
    for (const posId of positionsIds) {
        // Not all have ministry tasks
        const hasMinTask = Math.random() > 0.6;

        await prisma.formularz.create({
            data: {
                pozycja_budzetu_id: posId,
                zadanie_ministerstwo_id: hasMinTask ? getRandom(minTasksIds) : null,
                data_utworzenia: new Date(),
                status: ['Roboczy', 'Przesłany', 'Zatwierdzony'][getRandomInt(0, 2)],
                data_przeslania: Math.random() > 0.5 ? new Date() : null
            }
        });
    }

    console.log('✅ Full database seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
