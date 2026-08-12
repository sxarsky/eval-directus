// Eval seed: populate directus_comments with a realistic volume of activity so the
// commented-items summary has meaningful data to report. Runs after `directus bootstrap`
// (schema present) and before the server starts. SQLite, via Directus's own knex.
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const DB_FILENAME = process.env.DB_FILENAME || '/directus/database/database.sqlite';
const TARGET_COLLECTION = 'articles';
const TARGET_ITEM = '1';
const COUNT = 121;

// Resolve knex from Directus's pnpm store (not hoisted to /directus/node_modules).
const pnpmStore = '/directus/node_modules/.pnpm';
const knexDir = fs.readdirSync(pnpmStore).find((d) => d.startsWith('knex@'));
if (!knexDir) throw new Error('[seed-comments] could not locate knex in pnpm store');
const Knex = require(path.join(pnpmStore, knexDir, 'node_modules', 'knex'));

const db = Knex({
	client: 'sqlite3',
	connection: { filename: DB_FILENAME },
	useNullAsDefault: true,
});

(async () => {
	const now = new Date().toISOString();
	const rows = Array.from({ length: COUNT }, (_, i) => ({
		id: randomUUID(),
		collection: TARGET_COLLECTION,
		item: TARGET_ITEM,
		comment: `Seed comment #${i + 1}`,
		date_created: now,
		date_updated: now,
	}));

	await db.batchInsert('directus_comments', rows, 50);

	const [{ n }] = await db('directus_comments').count({ n: '*' });
	console.log(`[seed-comments] inserted ${COUNT} comments on ${TARGET_COLLECTION}/${TARGET_ITEM}; directus_comments now has ${n} rows`);
	await db.destroy();
})().catch((e) => {
	console.error('[seed-comments] FAILED:', e && e.message ? e.message : e);
	process.exit(1);
});
