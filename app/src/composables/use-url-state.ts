import type { Filter } from '@directus/types';
import { isEqual } from 'lodash';
import { Ref, watch } from 'vue';
import { RouteLocationNormalizedLoaded, Router } from 'vue-router';

interface UseUrlStateOptions {
	route: RouteLocationNormalizedLoaded;
	router: Router;
	filter: Ref<Filter | null>;
	search: Ref<string | null>;
	layoutQuery: Ref<Record<string, any>>;
	layout: Ref<string | null>;
	disabled: Ref<boolean>;
}

/**
 * Syncs items-list filter / search / sort / page state to the URL query string.
 * On mount, URL query params override preset defaults (when present).
 * On change, the URL is updated via router.replace so navigation history isn't bloated.
 *
 * Disabled when `disabled` is true (e.g., bookmark mode where preset is the source of truth).
 */
export function useUrlState(options: UseUrlStateOptions) {
	const { route, router, filter, search, layoutQuery, layout, disabled } = options;

	// Initial hydration: URL → state
	hydrateFromUrl();

	// State → URL watchers
	watch(filter, () => syncToUrl(), { deep: true });
	watch(search, () => syncToUrl());
	watch(layoutQuery, () => syncToUrl(), { deep: true });
	watch(layout, () => syncToUrl());

	function hydrateFromUrl() {
		if (disabled.value) return;

		const q = route.query;

		if (typeof q.filter === 'string') {
			try {
				filter.value = JSON.parse(decodeURIComponent(q.filter));
			} catch {
				// ignore malformed
			}
		}

		if (typeof q.search === 'string') {
			search.value = q.search;
		}

		if (typeof q.sort === 'string' && layout.value) {
			const layoutKey = layout.value;
			const existing = layoutQuery.value?.[layoutKey] ?? {};
			layoutQuery.value = {
				...layoutQuery.value,
				[layoutKey]: { ...existing, sort: q.sort.split(',') },
			};
		}

		if (typeof q.page === 'string' && layout.value) {
			const layoutKey = layout.value;
			const existing = layoutQuery.value?.[layoutKey] ?? {};
			const pageNum = Number(q.page);
			if (Number.isFinite(pageNum) && pageNum > 0) {
				layoutQuery.value = {
					...layoutQuery.value,
					[layoutKey]: { ...existing, page: pageNum },
				};
			}
		}
	}

	function syncToUrl() {
		if (disabled.value) return;

		const next: Record<string, string | undefined> = { ...route.query } as any;

		if (filter.value) {
			next.filter = encodeURIComponent(JSON.stringify(filter.value));
		} else {
			delete next.filter;
		}

		if (search.value) {
			next.search = search.value;
		} else {
			delete next.search;
		}

		const layoutKey = layout.value;
		const lq = layoutKey ? layoutQuery.value?.[layoutKey] : undefined;

		if (lq?.sort) {
			const sortArr = Array.isArray(lq.sort) ? lq.sort : [lq.sort];
			next.sort = sortArr.join(',');
		} else {
			delete next.sort;
		}

		if (lq?.page && lq.page > 1) {
			next.page = String(lq.page);
		} else {
			delete next.page;
		}

		if (isEqual(next, route.query)) return;

		router.replace({ query: next as any }).catch(() => {
			// Navigation duplicates / aborted navigation — safe to ignore
		});
	}
}
</content>
</invoke>