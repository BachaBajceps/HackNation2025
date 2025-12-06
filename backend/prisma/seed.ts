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
    console.log('🌱 Starting database seed...');

    // Load JSON data
    const parts = JSON.parse(await readFile(join(frontendDataPath, 'czesci.json'), 'utf-8')) as DictionaryItem[];
    const sections = JSON.parse(await readFile(join(frontendDataPath, 'dzialy.json'), 'utf-8')) as DictionaryItem[];
    const chapters = JSON.parse(await readFile(join(frontendDataPath, 'rozdzialy.json'), 'utf-8')) as ChapterItem[];
    const paragraphs = JSON.parse(await readFile(join(frontendDataPath, 'paragrafy.json'), 'utf-8')) as DictionaryItem[];
    const taskBudgets = JSON.parse(await readFile(join(frontendDataPath, 'zadania_budzetowe.json'), 'utf-8')) as TaskBudgetItem[];

    // Financing sources (hardcoded as in frontend dictionaries.ts)
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

    // Seed: czesc_budzetowa (Parts)
    console.log('📋 Seeding czesc_budzetowa...');
    for (const part of parts) {
        await prisma.czesc_budzetowa.upsert({
            where: { kod: part.code },
            update: { nazwa: part.name },
            create: { kod: part.code, nazwa: part.name },
        });
    }
    console.log(`✓ Seeded ${parts.length} parts`);

    // Seed: dzial (Sections)
    console.log('📋 Seeding dzial...');
    for (const section of sections) {
        await prisma.dzial.upsert({
            where: { kod: section.code },
            update: { nazwa: section.name },
            create: { kod: section.code, nazwa: section.name },
        });
    }
    console.log(`✓ Seeded ${sections.length} sections`);

    // Seed: rozdzial (Chapters)
    console.log('📋 Seeding rozdzial...');
    for (const chapter of chapters) {
        const parentDzial = await prisma.dzial.findUnique({
            where: { kod: chapter.parentSection },
        });

        if (parentDzial) {
            await prisma.rozdzial.upsert({
                where: { kod: chapter.code },
                update: { nazwa: chapter.name, dzial_id: parentDzial.id },
                create: { kod: chapter.code, nazwa: chapter.name, dzial_id: parentDzial.id },
            });
        }
    }
    console.log(`✓ Seeded ${chapters.length} chapters`);

    // Seed: paragraf (Paragraphs)
    console.log('📋 Seeding paragraf...');
    for (const paragraph of paragraphs) {
        await prisma.paragraf.upsert({
            where: { kod: paragraph.code },
            update: { nazwa: paragraph.name },
            create: { kod: paragraph.code, nazwa: paragraph.name },
        });
    }
    console.log(`✓ Seeded ${paragraphs.length} paragraphs`);

    // Seed: zrodlo_finansowania (Financing Sources)
    console.log('📋 Seeding zrodlo_finansowania...');
    for (const source of financingSources) {
        await prisma.zrodlo_finansowania.upsert({
            where: { kod: source.code },
            update: { nazwa: source.name },
            create: { kod: source.code, nazwa: source.name },
        });
    }
    console.log(`✓ Seeded ${financingSources.length} financing sources`);

    // Seed: budzet_zadaniowy_skrocony and budzet_zadaniowy_szczegolowy
    console.log('📋 Seeding task budgets...');

    // Group by first two code parts (XX.XX for short)
    const shortBudgets = new Map<string, TaskBudgetItem>();
    const detailedBudgets: TaskBudgetItem[] = [];

    for (const task of taskBudgets) {
        const parts = task.code.split('.');
        if (parts.length >= 2) {
            const shortCode = `${parts[0]}.${parts[1]}`;
            if (!shortBudgets.has(shortCode)) {
                shortBudgets.set(shortCode, {
                    code: shortCode,
                    name: task.name,
                    level: 2,
                });
            }
            if (parts.length === 4) {
                detailedBudgets.push(task);
            }
        }
    }

    // Seed short budgets
    for (const [code, budget] of shortBudgets) {
        const parts = code.split('.');
        await prisma.budzet_zadaniowy_skrocony.upsert({
            where: { kod: code },
            update: { funkcja: parts[0], zadanie: parts[1], nazwa: budget.name },
            create: { kod: code, funkcja: parts[0], zadanie: parts[1], nazwa: budget.name },
        });
    }
    console.log(`✓ Seeded ${shortBudgets.size} short task budgets`);

    // Seed detailed budgets
    for (const task of detailedBudgets) {
        const parts = task.code.split('.');
        const shortCode = `${parts[0]}.${parts[1]}`;
        const shortBudget = await prisma.budzet_zadaniowy_skrocony.findUnique({
            where: { kod: shortCode },
        });

        if (shortBudget && parts.length === 4) {
            await prisma.budzet_zadaniowy_szczegolowy.upsert({
                where: { kod: task.code },
                update: {
                    podzadanie: parts[2],
                    dzialanie: parts[3],
                    nazwa: task.name,
                    budzet_skrocony_id: shortBudget.id,
                },
                create: {
                    kod: task.code,
                    podzadanie: parts[2],
                    dzialanie: parts[3],
                    nazwa: task.name,
                    budzet_skrocony_id: shortBudget.id,
                },
            });
        }
    }
    console.log(`✓ Seeded ${detailedBudgets.length} detailed task budgets`);

    // Seed: grupa_wydatkow (Expenditure Groups)
    console.log('📋 Seeding grupa_wydatkow...');
    const expenditureGroups = [
        'Wydatki bieżące',
        'Wydatki majątkowe',
        'Wydatki na obsługę długu',
    ];

    for (const group of expenditureGroups) {
        await prisma.grupa_wydatkow.upsert({
            where: { nazwa: group },
            update: {},
            create: { nazwa: group },
        });
    }
    console.log(`✓ Seeded ${expenditureGroups.length} expenditure groups`);

    console.log('✅ Database seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
