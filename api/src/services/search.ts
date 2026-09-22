import { ForbiddenError } from '@directus/errors';
import type { AbstractServiceOptions, Accountability, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import getDatabase from '../database/index.js';
import { calculateRelevance } from '../utils/calculate-relevance.js';
import {
	type SearchParams,
	validateSearchParams,
	type RawSearchQuery,
} from '../utils/validate-search-params.js';

export interface SearchHit {
	collection: string;
	id: string | number;
	field: string;
	snippet: string;
	score: number;
}

export interface SearchResponse {
	results: SearchHit[];
	total_count: number;
}

const SNIPPET_RADIUS = 30;

function buildSnippet(value: string, q: string): string {
	const idx = value.toLowerCase().indexOf(q.toLowerCase());
	if (idx === -1) return value.slice(0, SNIPPET_RADIUS * 2);
	const start = Math.max(0, idx - SNIPPET_RADIUS);
	const end = Math.min(value.length, idx + q.length + SNIPPET_RADIUS);
	const before = value.slice(start, idx);
	const match = value.slice(idx, idx + q.length);
	const after = value.slice(idx + q.length, end);
	return `${start > 0 ? '...' : ''}${before}<mark>${match}</mark>${after}${end < value.length ? '...' : ''}`;
}

function selectSearchableFields(
	schema: SchemaOverview,
	collections?: string[],
	fields?: string[],
): Array<{ collection: string; field: string }> {
	const out: Array<{ collection: string; field: string }> = [];
	const targetCollections = collections ?? Object.keys(schema.collections);
	for (const collection of targetCollections) {
		const collDef = schema.collections[collection];
		if (!collDef) continue;
		for (const [fieldName, fieldDef] of Object.entries(collDef.fields)) {
			if (fields && !fields.includes(fieldName)) continue;
			if (fieldDef.type === 'string' || fieldDef.type === 'text') {
				out.push({ collection, field: fieldName });
			}
		}
	}
	return out;
}

export class SearchService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = options.schema;
	}

	async search(query: RawSearchQuery): Promise<SearchResponse> {
		if (!this.accountability?.user) throw new ForbiddenError();

		const params: SearchParams = validateSearchParams(query, this.schema);
		const targets = selectSearchableFields(this.schema, params.collections, params.fields);

		if (targets.length === 0) {
			return { results: [], total_count: 0 };
		}

		const needle = `%${params.q.toLowerCase()}%`;
		const hits: SearchHit[] = [];

		for (const { collection, field } of targets) {
			const rows = await this.knex
				.select(['id', field])
				.from(collection)
				.whereRaw(`LOWER(??) LIKE ?`, [field, needle]);

			for (const row of rows) {
				const value = String(row[field] ?? '');
				const matchCount = (value.toLowerCase().match(new RegExp(params.q.toLowerCase(), 'g')) || []).length;
				const score = calculateRelevance({ matchCount, fieldLength: value.length });
				hits.push({
					collection,
					id: row.id,
					field,
					snippet: buildSnippet(value, params.q),
					score,
				});
			}
		}

		hits.sort((a, b) => b.score - a.score);

		const total_count = hits.length;
		const paged = hits.slice(params.offset, params.offset + params.limit);

		return { results: paged, total_count };
	}
}
