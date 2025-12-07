import prisma from './src/lib/prisma';

async function deleteFormsFromDeptA() {
    // Find all pozycja_budzetu for Departament A
    const pozycje = await prisma.pozycja_budzetu.findMany({
        where: { nazwa_komorki_organizacyjnej: 'Departament A' },
        include: { formularz: true }
    });

    console.log(`Found ${pozycje.length} pozycje for Departament A`);

    for (const poz of pozycje) {
        // Delete formularze first (due to FK constraint)
        for (const form of poz.formularz) {
            await prisma.formularz.delete({ where: { id: form.id } });
            console.log(`Deleted formularz #${form.id}`);
        }

        // Delete pozycja_budzetu
        await prisma.pozycja_budzetu.delete({ where: { id: poz.id } });
        console.log(`Deleted pozycja_budzetu #${poz.id}`);
    }

    console.log('Done!');
}

deleteFormsFromDeptA().catch(console.error);
