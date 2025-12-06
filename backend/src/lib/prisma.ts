import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

// Path to the database file
const dbPath = path.resolve(process.cwd(), '..', 'budget_planning.db');

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
    const adapter = new PrismaBetterSqlite3({ url: dbPath });
    return new PrismaClient({ adapter });
};

export const prisma = global.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}

export default prisma;
