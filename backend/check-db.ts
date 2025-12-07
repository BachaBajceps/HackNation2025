import prisma from './src/lib/prisma';

async function checkOrphanedData() {
    const withoutDept = await prisma.pozycja_budzetu.count({
        where: { nazwa_komorki_organizacyjnej: null }
    });

    const total = await prisma.pozycja_budzetu.count();

    console.log(`Pozycje bez przypisanego departamentu: ${withoutDept} / ${total}`);

    // Check if there are any formularze at all
    const allForms = await prisma.formularz.findMany({
        include: {
            pozycja_budzetu: {
                select: { nazwa_komorki_organizacyjnej: true }
            }
        }
    });

    console.log('\n=== All forms ===');
    allForms.forEach(f => {
        console.log(`Form #${f.id}: status="${f.status}", dept="${f.pozycja_budzetu?.nazwa_komorki_organizacyjnej}"`);
    });
}

checkOrphanedData().catch(console.error);
