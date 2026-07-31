<script setup lang="ts">
import { ref } from 'vue';
import VButton from '@/components/v-button.vue';
import { useCollectionWizardStore } from '@/stores/collection-wizard';

const emit = defineEmits(['next', 'back']);
const store = useCollectionWizardStore();

type Action = 'create' | 'read' | 'update' | 'delete';
const actions: Action[] = ['create', 'read', 'update', 'delete'];

interface PermissionGrid {
	role: string | null; // null = "public" / anonymous
	create: boolean;
	read: boolean;
	update: boolean;
	delete: boolean;
}

const roles = ref<PermissionGrid[]>([
	{ role: 'admin', create: true, read: true, update: true, delete: true },
	{ role: null, create: false, read: false, update: false, delete: false },
]);

if (store.permissions.length > 0) {
	// Hydrate the grid from prior wizard state.
	const grouped = new Map<string, PermissionGrid>();
	for (const p of store.permissions) {
		const key = p.role ?? '__public__';
		const existing = grouped.get(key) ?? {
			role: p.role,
			create: false,
			read: false,
			update: false,
			delete: false,
		};
		existing[p.action] = p.allow;
		grouped.set(key, existing);
	}
	roles.value = Array.from(grouped.values());
}

function proceed() {
	const flattened = roles.value.flatMap((row) =>
		actions.map((action) => ({
			role: row.role,
			action,
			allow: row[action],
		})),
	);
	store.setPermissions(flattened);
	emit('next');
}
</script>

<template>
	<div class="step-permissions">
		<h3>Step 4 — Permissions per role</h3>

		<table data-test="wizard-permissions-grid">
			<thead>
				<tr>
					<th>Role</th>
					<th v-for="a in actions" :key="a">{{ a }}</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="(row, idx) in roles" :key="idx" :data-test="`wizard-permissions-row-${idx}`">
					<td>{{ row.role ?? '(public)' }}</td>
					<td v-for="a in actions" :key="a">
						<input
							v-model="row[a]"
							type="checkbox"
							:data-test="`wizard-permissions-${idx}-${a}`"
						/>
					</td>
				</tr>
			</tbody>
		</table>

		<div class="actions">
			<VButton secondary data-test="wizard-permissions-back" @click="emit('back')">Back</VButton>
			<VButton data-test="wizard-permissions-next" @click="proceed">Next</VButton>
		</div>
	</div>
</template>

<style scoped>
.step-permissions {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 16px;
	max-width: 560px;
}
table {
	border-collapse: collapse;
	width: 100%;
}
th, td {
	padding: 8px 12px;
	text-align: left;
	border-bottom: 1px solid var(--theme--border-color, #eee);
}
.actions {
	display: flex;
	gap: 8px;
	margin-top: 8px;
}
</style>
