
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Pobieranie danych z bazy...");
    const pozycje = await prisma.pozycja_budzetu.findMany({
        include: {
            czesc_budzetowa: true,
            dzial: true,
            rozdzial: true,
            paragraf: true,
            zadanie_szczegoly: {
                include: {
                    opis_zadania: true,
                    dane_finansowe: true
                }
            }
        },
        orderBy: {
            id: 'desc'
        }
    });

    if (pozycje.length === 0) {
        console.log("Baza jest pusta.");
    } else {
        console.log(`Znaleziono ${pozycje.length} rekordów:`);
        pozycje.forEach(p => {
            console.log("------------------------------------------------");
            console.log(`ID: ${p.id}`);
            console.log(`Projekt: ${p.nazwa_programu_projektu}`);
            console.log(`Klasyfikacja: ${p.czesc_budzetowa.kod}-${p.dzial?.kod}-${p.rozdzial?.kod}-${p.paragraf?.kod}`);
            if (p.zadanie_szczegoly) {
                console.log(`Zadanie: ${p.zadanie_szczegoly.opis_zadania?.nazwa_zadania}`);
                console.log(`Kwota (rok ${p.zadanie_szczegoly.dane_finansowe?.rok}): ${p.zadanie_szczegoly.dane_finansowe?.potrzeby_finansowe}`);
            }
        });
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
