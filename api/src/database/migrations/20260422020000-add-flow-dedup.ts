import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('directus_flow_dedup', (table) => {
		table.string('key').primary();
		table.uuid('flow').notNullable();
		table.timestamp('created_at').notNullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists('directus_flow_dedup');
}
