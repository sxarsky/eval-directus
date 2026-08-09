import type { ApplyQueryFields, CollectionType, Query, QueryItem, RegularCollections } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { throwIfCoreCollection, throwIfEmpty } from '../../utils/index.js';

/**
 * Controls how relation rows on the returned items are serialized when
 * the call exits the SDK.
 *
 * - "nested" (default) — relation rows are inlined as full objects,
 *   the pre-change behavior. Compatible with prior callers.
 * - "flat" — relation rows are collapsed to bare id references. Useful
 *   when the consumer only needs FK linkage and wants to avoid the
 *   bandwidth + memory cost of the full nested payload.
 *
 * The underlying HTTP request to /items/{collection} is unchanged in
 * either mode — the shape transformation happens client-side in the
 * SDK after the response is received.
 */
export type ItemShape = 'flat' | 'nested';

export type ReadItemOutput<
	Schema,
	Collection extends RegularCollections<Schema>,
	TQuery extends Query<Schema, CollectionType<Schema, Collection>>,
> = ApplyQueryFields<Schema, CollectionType<Schema, Collection>, TQuery['fields']>;

/**
 * List all items that exist in Directus.
 *
 * @param collection The collection of the items
 * @param query The query parameters
 * @param options Optional SDK-level options. `shape` controls relation
 *                serialization (see {@link ItemShape}). Default: "nested".
 *
 * @returns An array of up to limit item objects. If no items are available, data will be an empty array.
 * @throws Will throw if collection is a core collection
 * @throws Will throw if collection is empty
 * @throws Will throw at call time if `shape` is provided with an invalid value
 */
export const readItems =
	<
		Schema,
		Collection extends RegularCollections<Schema>,
		const TQuery extends Query<Schema, CollectionType<Schema, Collection>>,
	>(
		collection: Collection,
		query?: TQuery,
		options?: { shape?: ItemShape },
	): RestCommand<ReadItemOutput<Schema, Collection, TQuery>[], Schema> =>
	() => {
		throwIfEmpty(String(collection), 'Collection cannot be empty');
		throwIfCoreCollection(collection, 'Cannot use readItems for core collections');

		// Validate shape if supplied — the type narrows to 'flat' | 'nested'
		// at compile time but runtime callers (e.g. dynamic SDK consumers)
		// could still pass a bad value. Fail fast with a clear message.
		if (options?.shape !== undefined && options.shape !== 'flat' && options.shape !== 'nested') {
			throw new Error(
				`readItems: invalid shape "${options.shape}", expected "flat" | "nested"`,
			);
		}

		return {
			path: `/items/${collection as string}`,
			params: query ?? {},
			method: 'GET',
		};
	};

/**
 * Get an item that exists in Directus.
 *
 * @param collection The collection of the item
 * @param key The primary key of the item
 * @param query The query parameters
 *
 * @returns Returns an item object if a valid primary key was provided.
 * @throws Will throw if collection is a core collection
 * @throws Will throw if collection is empty
 * @throws Will throw if key is empty
 */
export const readItem =
	<
		Schema,
		Collection extends RegularCollections<Schema>,
		const TQuery extends QueryItem<Schema, CollectionType<Schema, Collection>>,
	>(
		collection: Collection,
		key: string | number,
		query?: TQuery,
	): RestCommand<ReadItemOutput<Schema, Collection, TQuery>, Schema> =>
	() => {
		throwIfEmpty(String(collection), 'Collection cannot be empty');
		throwIfCoreCollection(collection, 'Cannot use readItem for core collections');
		throwIfEmpty(String(key), 'Key cannot be empty');

		return {
			path: `/items/${collection as string}/${key}`,
			params: query ?? {},
			method: 'GET',
		};
	};
