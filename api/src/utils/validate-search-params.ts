import type { SchemaOverview } from '@directus/types';

export interface SearchParams {
	q: string;
	collections?: string[];
	fields?: string[];
	limit: number;
	offset: number;
}

export interface RawSearchQuery {
	q?: unknown;
	collections?: unknown;
	fields?: unknown;
	limit?: unknown;
	offset?: unknown;
}

export class SearchValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'SearchValidationError';
	}
}

const TEXT_FIELD_TYPES = new Set(['string', 'text']);

function parseList(value: unknown): string[] | undefined {
	if (value === undefined || value === null || value === '') return undefined;
	if (Array.isArray(value)) return value.map((entry) => String(entry).trim()).filter(Boolean);
	return String(value)
		.split(',')
		.map((entry) => entry.trim())
		.filter(Boolean);
}

function parseNumber(value: unknown, fallback: number): number {
	if (value === undefined || value === null || value === '') return fallback;
	const n = Number(value);
	if (!Number.isFinite(n)) return Number.NaN;
	return n;
}

export function validateSearchParams(query: RawSearchQuery, schema: SchemaOverview): SearchParams {
	const q = typeof query.q === 'string' ? query.q.trim() : '';

	if (q.length < 2 || q.length > 100) {
		throw new SearchValidationError('Search query required (2-100 chars)');
	}

	const collections = parseList(query.collections);
	if (collections) {
		const unknownCollections = collections.filter((c) => !schema.collections[c]);
		if (unknownCollections.length > 0) {
			throw new SearchValidationError(`Invalid collections: [${unknownCollections.join(', ')}]`);
		}
	}

	const fields = parseList(query.fields);
	if (fields) {
		const targetCollections = collections ?? Object.keys(schema.collections);
		for (const field of fields) {
			const matched = targetCollections.some((c) => {
				const collection = schema.collections[c];
				const fieldDef = collection?.fields?.[field];
				return fieldDef && TEXT_FIELD_TYPES.has(fieldDef.type);
			});
			if (!matched) {
				throw new SearchValidationError(`Field '${field}' is not text-searchable`);
			}
		}
	}

	const limit = parseNumber(query.limit, 20);
	if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
		throw new SearchValidationError('Limit must be 1-100');
	}

	const offset = parseNumber(query.offset, 0);
	if (!Number.isInteger(offset) || offset < 0) {
		throw new SearchValidationError('Offset must be >= 0');
	}

	return { q, collections, fields, limit, offset };
}
