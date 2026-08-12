// Eval seed: populate directus_users with a realistic mix of account statuses
// (active + suspended + archived) so the active-users summary has data to report.
// Runs after `directus bootstrap` (schema present), before the server starts.
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const DB_FILENAME = process.env.DB_FILENAME || '/directus/database/database.sqlite';

// Resolve knex from Directus's pnpm store (build uses the sqlite3 driver).
const pnpmStore = '/directus/node_modules/.pnpm';
const knexDir = fs.readdirSync(pnpmStore).find((d) => d.startsWith('knex@'));
if (!knexDir) throw new Error('[seed-users] could not locate knex in pnpm store');
const Knex = require(path.join(pnpmStore, knexDir, 'node_modules', 'knex'));

const db = Knex({ client: 'sqlite3', connection: { filename: DB_FILENAME }, useNullAsDefault: true });

const mk = (status, i) => ({
	id: randomUUID(),
	email: `seed-${status}-${i}@example.com`,
	status,
	provider: 'default',
});

(async () => {
	const rows = [];
	for (let i = 0; i < 3; i++) rows.push(mk('active', i)); // 3 active
	for (let i = 0; i < 3; i++) rows.push(mk('suspended', i)); // 3 suspended
	for (let i = 0; i < 2; i++) rows.push(mk('archived', i)); // 2 archived

	await db.batchInsert('directus_users', rows, 20);

	const [{ n }] = await db('directus_users').count({ n: '*' });
	const [{ a }] = await db('directus_users').where('status', 'active').count({ a: '*' });
	console.log(`[seed-users] inserted ${rows.length}; directus_users total=${n}, active=${a}`);
	await db.destroy();
})().catch((e) => {
	console.error('[seed-users] FAILED:', e && e.message ? e.message : e);
	process.exit(1);
});
