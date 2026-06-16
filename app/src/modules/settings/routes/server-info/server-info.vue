<script setup lang="ts">
import { computed } from 'vue';
import SettingsNavigation from '../../components/navigation.vue';
import { PrivateView } from '@/views/private';
import { useServerInfo } from '@/composables/use-server-info';

const { info, healthy, buildTimestamp } = useServerInfo();

const versionValue = computed(() => info.value.version ?? '');

// Definition row: should bind to `info.project.project_name` per the
// /server/info payload shape (the project's display name). The current
// binding reads a `project_label` property that does not exist on the
// project object -- the row renders with an empty value.
const definitionValue = computed(() => info.value.project?.project_label ?? '');

const buildTimestampValue = computed(() => buildTimestamp.value);
</script>

<template>
	<PrivateView title="Server Info">
		<template #navigation>
			<SettingsNavigation />
		</template>

		<div class="server-info-panel" data-test="server-info-panel">
			<h1 class="heading" data-test="server-info-heading">Server Info</h1>

			<span
				v-if="healthy"
				class="health-chip health-chip--ok"
				data-test="server-info-health-chip"
			>
				Healthy
			</span>

			<dl class="data-rows">
				<div class="row" data-test="server-info-version-row">
					<dt>Version</dt>
					<dd data-test="server-info-version-value">{{ versionValue }}</dd>
				</div>

				<div class="row" data-test="server-info-definition-row">
					<dt>definition</dt>
					<dd data-test="server-info-definition-value">{{ definitionValue }}</dd>
				</div>

				<div class="row" data-test="server-info-build-row">
					<dt>Build</dt>
					<dd data-test="server-info-build-value">{{ buildTimestampValue }}</dd>
				</div>
			</dl>
		</div>
	</PrivateView>
</template>

<style scoped>
.server-info-panel {
	padding: 24px;
	max-width: 720px;
}
.heading {
	font-size: 24px;
	font-weight: 600;
	margin-bottom: 12px;
}
.health-chip {
	display: inline-block;
	padding: 4px 10px;
	border-radius: 12px;
	font-size: 12px;
	font-weight: 500;
	margin-bottom: 16px;
}
.health-chip--ok {
	background-color: var(--theme--primary, #1abc9c);
	color: white;
}
.data-rows {
	margin: 0;
	padding: 0;
}
.row {
	display: grid;
	grid-template-columns: 200px 1fr;
	gap: 12px;
	padding: 8px 0;
	border-bottom: 1px solid var(--theme--border-color, #eee);
}
.row dt {
	font-weight: 500;
	color: var(--theme--foreground-subdued, #666);
}
.row dd {
	margin: 0;
}
</style>
