import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
    // Use DATABASE_URL or default to dev.db
    const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';

    // Create adapter with url config
    const adapter = new PrismaBetterSqlite3({ url: dbUrl });

    // Return PrismaClient with adapter
    return new PrismaClient({ adapter });
};

export const prisma = global.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}

export default prisma;
