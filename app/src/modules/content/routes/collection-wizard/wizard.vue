<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import StepFields from './steps/step-fields.vue';
import StepName from './steps/step-name.vue';
import StepPermissions from './steps/step-permissions.vue';
import StepRelations from './steps/step-relations.vue';
import StepReview from './steps/step-review.vue';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import { useCollectionWizardStore } from '@/stores/collection-wizard';
import { useCollectionsStore } from '@/stores/collections';

const router = useRouter();
const store = useCollectionWizardStore();
const collectionsStore = useCollectionsStore();

type WizardStep = 1 | 2 | 3 | 4 | 5;
const currentStep = ref<WizardStep>(1);
const submitting = ref(false);
const errorMessage = ref<string | null>(null);
// failedAt records which call (collections | fields | relations | permissions)
// last failed. The retry path resumes from this point rather than re-running
// already-successful prereqs so partial creation does not duplicate work.
const failedAt = ref<'collections' | 'fields' | 'relations' | 'permissions' | null>(null);

function advance() {
	currentStep.value = Math.min(5, currentStep.value + 1) as WizardStep;
}

function regress() {
	currentStep.value = Math.max(1, currentStep.value - 1) as WizardStep;
}

function cancel() {
	// Cancelling mid-wizard issues no backend call: clear the staged state
	// and route back to the data-model index. Verified by DR20-U6.
	store.reset();
	router.push('/settings/data-model');
}

async function callCollections(): Promise<void> {
	await api.post('/collections', {
		collection: store.name,
		meta: { singleton: store.singleton },
		schema: {},
	});
}

async function callFields(): Promise<void> {
	for (const f of store.fields) {
		await api.post(`/fields/${store.name}`, {
			field: f.field,
			type: f.type,
		});
	}
}

async function callRelations(): Promise<void> {
	for (const r of store.relations) {
		await api.post('/relations', {
			collection: store.name,
			field: r.field,
			related_collection: r.relatedCollection,
		});
	}
}

async function callPermissions(): Promise<void> {
	const allowed = store.permissions.filter((p) => p.allow);
	for (const p of allowed) {
		await api.post('/permissions', {
			role: p.role,
			collection: store.name,
			action: p.action,
		});
	}
}

async function confirm() {
	if (submitting.value) return;
	submitting.value = true;
	errorMessage.value = null;

	const sequence: { name: 'collections' | 'fields' | 'relations' | 'permissions'; run: () => Promise<void> }[] = [
		{ name: 'collections', run: callCollections },
		{ name: 'fields', run: callFields },
		{ name: 'relations', run: callRelations },
		{ name: 'permissions', run: callPermissions },
	];

	// Resume from the last-failed step if this is a retry, otherwise start fresh.
	const startIndex = failedAt.value
		? sequence.findIndex((s) => s.name === failedAt.value)
		: 0;

	for (let i = startIndex; i < sequence.length; i++) {
		try {
			await sequence[i]!.run();
		} catch (err: any) {
			failedAt.value = sequence[i]!.name;
			errorMessage.value = `Failed at ${sequence[i]!.name}: ${err?.message ?? 'unknown error'}. You can retry from this step.`;
			submitting.value = false;
			return;
		}
	}

	// Success: refresh collections cache, clear wizard state, route to the
	// new collection's data-model edit page.
	failedAt.value = null;
	await collectionsStore.hydrate();
	const createdName = store.name;
	store.reset();
	submitting.value = false;
	router.push(`/settings/data-model/${createdName}`);
}
</script>

<template>
	<div class="collection-wizard">
		<header data-test="wizard-step-indicator">Step {{ currentStep }} of 5</header>

		<StepName v-if="currentStep === 1" @next="advance" />
		<StepFields v-else-if="currentStep === 2" @next="advance" @back="regress" />
		<StepRelations v-else-if="currentStep === 3" @next="advance" @back="regress" />
		<StepPermissions v-else-if="currentStep === 4" @next="advance" @back="regress" />
		<StepReview v-else-if="currentStep === 5" @back="regress" @confirm="confirm" />

		<p v-if="errorMessage" class="error" data-test="wizard-error">{{ errorMessage }}</p>

		<div v-if="errorMessage" class="retry-row">
			<VButton data-test="wizard-retry" :disabled="submitting" @click="confirm">Retry from failed step</VButton>
		</div>

		<div class="cancel-row">
			<button type="button" class="cancel-link" data-test="wizard-cancel" @click="cancel">
				Cancel and discard
			</button>
		</div>
	</div>
</template>

<style scoped>
.collection-wizard {
	padding: 16px;
	max-width: 720px;
}
header {
	font-weight: 600;
	margin-bottom: 16px;
	font-size: 14px;
	color: var(--theme--foreground-subdued, #666);
}
.error {
	margin-top: 12px;
	color: var(--theme--danger, #c0392b);
	font-size: 13px;
}
.retry-row {
	margin-top: 8px;
}
.cancel-row {
	margin-top: 16px;
}
.cancel-link {
	background: none;
	border: none;
	color: var(--theme--foreground-subdued, #666);
	text-decoration: underline;
	cursor: pointer;
	font-size: 13px;
	padding: 0;
}
</style>
