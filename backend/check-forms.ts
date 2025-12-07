import prisma from './src/lib/prisma';

async function main() {
    const forms = await prisma.formularz.findMany();
    console.log('Total forms:', forms.length);

    const statusCounts: Record<string, number> = {};
    forms.forEach(f => {
        statusCounts[f.status] = (statusCounts[f.status] || 0) + 1;
    });
    console.log('Status counts:', statusCounts);

    if (forms.length > 0) {
        console.log('Sample form:', forms[0]);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
