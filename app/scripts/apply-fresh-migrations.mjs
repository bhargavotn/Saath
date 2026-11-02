import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const root = resolve(import.meta.dirname, '..');
const dbPath = process.argv[2] || resolve(root, '.tmp-audit', 'fresh.sqlite');
const journal = JSON.parse(readFileSync(resolve(root, 'drizzle/meta/_journal.json'), 'utf8'));

mkdirSync(dirname(dbPath), { recursive: true });
if (existsSync(dbPath)) {
  console.error('Refusing to reuse an existing database. Pass a new path.');
  process.exit(2);
}

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON;');
for (const entry of journal.entries) {
  const sql = readFileSync(resolve(root, `drizzle/${entry.tag}.sql`), 'utf8')
    .split('--> statement-breakpoint')
    .map(part => part.trim())
    .filter(Boolean);
  for (const statement of sql) db.exec(statement);
}

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
const indexes = db.prepare("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL ORDER BY name").all();
console.log(JSON.stringify({ dbPath, tables: tables.map(row => row.name), indexes }, null, 2));
db.close();
