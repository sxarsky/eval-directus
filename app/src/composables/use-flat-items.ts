import { readItems } from '@directus/sdk';
import { ref, Ref } from 'vue';
import sdk from '@/sdk';

/**
 * Thin convenience composable for admin views that need item lists where
 * relation rows are returned as bare id references rather than inlined
 * objects.
 *
 * Calls the SDK with `shape: 'flat'`, which is the new
 * presentation-layer option added in DR14. The HTTP request to
 * `/items/{collection}` is unchanged; the SDK applies the shape
 * transformation after the response is received.
 */
export interface UsableFlatItems<T> {
	items: Ref<T[]>;
	loading: Ref<boolean>;
	error: Ref<unknown | null>;
	fetch: (collection: string) => Promise<void>;
}

export function useFlatItems<T = Record<string, unknown>>(): UsableFlatItems<T> {
	const items = ref<T[]>([]) as Ref<T[]>;
	const loading = ref(false);
	const error = ref<unknown | null>(null);

	async function fetch(collection: string) {
		loading.value = true;
		error.value = null;
		try {
			// Pass shape: 'flat' so relation rows arrive as id references.
			// This is the option introduced in DR14.
			const result = (await sdk.request(
				readItems(collection as never, undefined, { shape: 'flat' }),
			)) as T[];
			items.value = result;
		} catch (err) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	}

	return { items, loading, error, fetch };
}
