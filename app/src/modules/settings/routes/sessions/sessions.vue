<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import SettingsNavigation from '../../components/navigation.vue';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import { PrivateView } from '@/views/private';
import { notify } from '@/utils/notify';

interface SessionRow {
	id: string;
	created_at: string;
	user_agent: string;
	ip: string;
	current: boolean;
}

const rows = ref<SessionRow[]>([]);
const loading = ref(false);
const revoking = ref<string | null>(null);

async function load() {
	loading.value = true;
	try {
		const response = await api.get('/users/me/sessions');
		rows.value = response.data?.data ?? [];
	} catch (err) {
		notify({ title: 'Failed to load sessions', type: 'error' });
	} finally {
		loading.value = false;
	}
}

async function revoke(sessionId: string) {
	if (revoking.value === sessionId) return;
	revoking.value = sessionId;
	try {
		await api.delete(`/users/me/sessions/${sessionId}`);
		notify({ title: 'Session revoked', type: 'success' });
		await load();
	} catch (err) {
		notify({ title: 'Failed to revoke session', type: 'error' });
	} finally {
		revoking.value = null;
	}
}

onMounted(load);

const currentRow = computed(() => rows.value.find((r) => r.current));
const otherRows = computed(() => rows.value.filter((r) => !r.current));
</script>

<template>
	<PrivateView title="Sessions">
		<template #navigation>
			<SettingsNavigation />
		</template>

		<div class="sessions-panel" data-test="sessions-panel">
			<h1 class="heading" data-test="sessions-heading">Active Sessions</h1>
			<p class="description">
				Sessions where your account is currently signed in. Revoking a
				session invalidates its cookie immediately — future requests
				from that session will fail authentication.
			</p>

			<p v-if="loading" data-test="sessions-loading">Loading…</p>

			<table v-else class="sessions-table" data-test="sessions-table">
				<thead>
					<tr>
						<th>Created</th>
						<th>User agent</th>
						<th>IP</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-if="currentRow"
						class="current-row"
						data-test="sessions-row-current"
					>
						<td>{{ currentRow.created_at }}</td>
						<td>{{ currentRow.user_agent }}</td>
						<td>{{ currentRow.ip }}</td>
						<td>
							<span class="current-badge" data-test="sessions-current-badge">
								Current session
							</span>
						</td>
					</tr>
					<tr
						v-for="row in otherRows"
						:key="row.id"
						:data-test="`sessions-row-${row.id}`"
					>
						<td>{{ row.created_at }}</td>
						<td>{{ row.user_agent }}</td>
						<td>{{ row.ip }}</td>
						<td>
							<VButton
								:disabled="revoking === row.id"
								:loading="revoking === row.id"
								secondary
								small
								:data-test="`sessions-revoke-${row.id}`"
								@click="revoke(row.id)"
							>
								Revoke
							</VButton>
						</td>
					</tr>
					<tr v-if="rows.length === 0">
						<td colspan="4" class="empty" data-test="sessions-empty">
							No sessions found.
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</PrivateView>
</template>

<style scoped>
.sessions-panel {
	padding: 24px;
	max-width: 880px;
}
.heading {
	font-size: 24px;
	font-weight: 600;
	margin-bottom: 8px;
}
.description {
	color: var(--theme--foreground-subdued, #666);
	margin-bottom: 16px;
}
.sessions-table {
	width: 100%;
	border-collapse: collapse;
}
.sessions-table th,
.sessions-table td {
	padding: 8px 12px;
	text-align: left;
	border-bottom: 1px solid var(--theme--border-color, #eee);
}
.current-row {
	background: var(--theme--background-subdued, #fafafa);
}
.current-badge {
	display: inline-block;
	padding: 2px 8px;
	border-radius: 10px;
	background: var(--theme--primary-subdued, #e8f7f3);
	color: var(--theme--primary, #1abc9c);
	font-size: 11px;
}
.empty {
	color: var(--theme--foreground-subdued, #999);
	text-align: center;
	padding: 24px 0;
}
</style>
