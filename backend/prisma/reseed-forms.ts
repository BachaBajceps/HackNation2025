import prisma from '../src/lib/prisma';
import { readFile } from 'fs/promises';
import { join } from 'path';

const frontendDataPath = join(process.cwd(), '..', 'frontend', 'src', 'data', 'dane_formularzy');

interface DictionaryItem {
    code: string;
    name: string;
}

async function main() {
    console.log('🗑️  Clearing budget entries...');

    // Clear forms and positions
    await prisma.formularz.deleteMany();
    await prisma.pozycja_budzetu.deleteMany();
    await prisma.zadanie_szczegoly.deleteMany();
    await prisma.dane_finansowe.deleteMany();
    await prisma.opis_zadania.deleteMany();

    console.log('✓ Forms and positions cleared');

    // Load departments
    const departments = JSON.parse(await readFile(join(frontendDataPath, 'departamenty.json'), 'utf-8')) as DictionaryItem[];

    // Take first 10 departments
    const first10Depts = departments.slice(0, 10);

    // Fetch required IDs
    const allDetailTasks = await prisma.budzet_zadaniowy_szczegolowy.findMany();
    const allChapters = await prisma.rozdzial.findMany({ include: { dzial: true } });
    const allParagraphs = await prisma.paragraf.findMany();
    const allSources = await prisma.zrodlo_finansowania.findMany();
    const allParts = await prisma.czesc_budzetowa.findMany();
    const allGroups = await prisma.grupa_wydatkow.findMany();

    if (allDetailTasks.length === 0 || allChapters.length === 0 || allParagraphs.length === 0) {
        console.error('❌ Dictionary data not found. Run full seed first.');
        process.exit(1);
    }

    const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    console.log('📋 Creating 2-3 entries for first 10 departments...');

    for (const dept of first10Depts) {
        const entriesCount = getRandomInt(2, 3);

        for (let i = 0; i < entriesCount; i++) {
            // Create opis_zadania
            const desc = await prisma.opis_zadania.create({
                data: {
                    nazwa_zadania: `Zadanie ${dept.code}-${i + 1}: Modernizacja systemów ${dept.name}`,
                    uzasadnienie: `Uzasadnienie realizacji zadania dla ${dept.name}`,
                    przeznaczenie_wydatkow: 'Wydatki na infrastrukturę i usługi.'
                }
            });

            // Create dane_finansowe for 2026
            const fin = await prisma.dane_finansowe.create({
                data: {
                    rok: 2026,
                    potrzeby_finansowe: parseFloat((50000 + Math.random() * 500000).toFixed(2)),
                    limit_wydatkow: parseFloat((40000 + Math.random() * 400000).toFixed(2)),
                    kwota_niezabezpieczona: parseFloat((Math.random() * 100000).toFixed(2)),
                    kwota_umowy: Math.random() > 0.5 ? parseFloat((Math.random() * 200000).toFixed(2)) : null,
                    nr_umowy: Math.random() > 0.5 ? `UM/2026/${dept.code}/${i + 1}` : null
                }
            });

            // Create zadanie_szczegoly
            const detail = await prisma.zadanie_szczegoly.create({
                data: {
                    opis_zadania_id: desc.id,
                    dane_finansowe_id: fin.id
                }
            });

            // Create pozycja_budzetu
            const chapter = getRandom(allChapters);
            const shortBudget = await prisma.budzet_zadaniowy_skrocony.findFirst();

            const pozycja = await prisma.pozycja_budzetu.create({
                data: {
                    zadanie_szczegoly_id: detail.id,
                    czesc_budzetowa_id: getRandom(allParts).id,
                    dzial_id: chapter.dzial_id,
                    rozdzial_id: chapter.id,
                    paragraf_id: getRandom(allParagraphs).id,
                    zrodlo_finansowania_id: getRandom(allSources).id,
                    grupa_wydatkow_id: getRandom(allGroups).id,
                    budzet_zadaniowy_szczegolowy_id: getRandom(allDetailTasks).id,
                    budzet_zadaniowy_skrocony_id: shortBudget?.id,
                    nazwa_komorki_organizacyjnej: dept.name,
                    dysponent_srodkow: dept.name,
                    budzet: '2026',
                    plan_wi: (Math.random() * 50000).toFixed(2)
                }
            });

            // Create formularz linked to pozycja_budzetu
            await prisma.formularz.create({
                data: {
                    pozycja_budzetu_id: pozycja.id,
                    data_utworzenia: new Date(),
                    status: 'Roboczy'
                }
            });
        }

        console.log(`✓ Created ${entriesCount} entries for ${dept.name}`);
    }

    console.log('✅ Reseeding completed! Created 20-30 budget entries for first 10 departments.');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
