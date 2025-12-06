
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), '../budget_planning.db');
console.log('Opening DB at:', dbPath);

try {
    const db = new Database(dbPath, { verbose: console.log });
    const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
    const tables = stmt.all();
    console.log('Tables:', JSON.stringify(tables, null, 2));
    db.close();
} catch (error) {
    console.error('Error:', error);
}
