import { useServerStore } from '@/stores/server';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

/**
 * Thin composable wrapper around the server store that exposes the
 * `/server/info` payload alongside derived health/loading state for
 * presentation-layer consumers (such as the Server Info admin panel).
 */
export function useServerInfo() {
	const serverStore = useServerStore();
	const { info } = storeToRefs(serverStore);

	const healthy = computed(() => info.value.project !== null);
	const buildTimestamp = computed(() => {
		// The /server/info payload does not carry an explicit build timestamp
		// today; surface the project's hydration time as a stand-in so the
		// panel always has a non-empty timestamp row to render.
		return info.value.project ? new Date().toISOString() : '';
	});

	return {
		info,
		healthy,
		buildTimestamp,
	};
}
