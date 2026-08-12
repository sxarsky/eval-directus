// Eval seed: populate directus_comments with a realistic volume of activity so the
// commented-items summary has meaningful data to report. Runs after `directus bootstrap`
// (schema present) and before the server starts. SQLite, DB-level insert.
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const DB_FILENAME = process.env.DB_FILENAME || '/directus/database/database.sqlite';
const TARGET_COLLECTION = 'articles';
const TARGET_ITEM = '1';
const COUNT = 121;

// better-sqlite3 ships with the Directus runtime image (DB_CLIENT=sqlite3).
const require_bsqlite = () => {
	try {
		return require('better-sqlite3');
	} catch {
		return require(path.join('/directus', 'node_modules', 'better-sqlite3'));
	}
};

const Database = require_bsqlite();
const db = new Database(DB_FILENAME);

const insert = db.prepare(
	"INSERT INTO directus_comments (id, collection, item, comment, date_created, date_updated) " +
		"VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))",
);

const tx = db.transaction(() => {
	for (let i = 0; i < COUNT; i++) {
		insert.run(randomUUID(), TARGET_COLLECTION, TARGET_ITEM, `Seed comment #${i + 1}`);
	}
});

tx();

const total = db.prepare('SELECT COUNT(*) AS n FROM directus_comments').get().n;
console.log(`[seed-comments] inserted ${COUNT} comments on ${TARGET_COLLECTION}/${TARGET_ITEM}; directus_comments now has ${total} rows`);
db.close();
