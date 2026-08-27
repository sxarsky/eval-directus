import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	const hasColumn = await knex.schema.hasColumn('directus_permissions', 'fields');
	if (!hasColumn) {
		await knex.schema.alterTable('directus_permissions', (table) => {
			table.json('fields').nullable();
		});
	}

	await knex('directus_permissions').whereNull('fields').update({ fields: JSON.stringify(['*']) });
}

export async function down(): Promise<void> {
	// Existing installations may already have directus_permissions.fields; keep it intact.
}
