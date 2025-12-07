import prisma from './src/lib/prisma';

async function main() {
    // First unlink formularze from zadanie_ministerstwo
    await prisma.formularz.updateMany({
        where: { zadanie_ministerstwo_id: { not: null } },
        data: { zadanie_ministerstwo_id: null }
    });
    console.log('Unlinked forms from constraints');

    // Now delete all constraints
    const result = await prisma.zadanie_ministerstwo.deleteMany();
    console.log('Deleted', result.count, 'constraints');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
