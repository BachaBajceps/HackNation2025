import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { SCHEMA_SQL, SEED_DEPARTAMENTY_SQL } from './schema';

const DB_PATH = path.join(process.cwd(), 'data', 'budzet.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    // Utworz folder data jesli nie istnieje
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    initializeSchema(db);
  }
  return db;
}

function initializeSchema(database: Database.Database): void {
  database.exec(SCHEMA_SQL);

  // Sprawdz czy sa departamenty
  const count = database.prepare('SELECT COUNT(*) as cnt FROM departamenty').get() as { cnt: number };
  if (count.cnt === 0) {
    database.exec(SEED_DEPARTAMENTY_SQL);
  }
}
