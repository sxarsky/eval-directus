<script setup lang="ts">
import { ref } from 'vue';
import VButton from '@/components/v-button.vue';
import VInput from '@/components/v-input.vue';
import { useCollectionsStore } from '@/stores/collections';
import { useCollectionWizardStore } from '@/stores/collection-wizard';
import { validateStepName } from '../validate';

const emit = defineEmits(['next']);
const store = useCollectionWizardStore();
const collectionsStore = useCollectionsStore();

const localName = ref(store.name);
const localSingleton = ref(store.singleton);
const errorMessage = ref<string | null>(null);

function proceed() {
	const existingNames = new Set(collectionsStore.allCollections.map((c) => c.collection));
	const err = validateStepName({ name: localName.value }, existingNames);
	if (err) {
		errorMessage.value = err;
		return;
	}
	errorMessage.value = null;
	store.setNameAndSingleton(localName.value, localSingleton.value);
	emit('next');
}
</script>

<template>
	<div class="step-name">
		<h3>Step 1 — Name &amp; singleton</h3>

		<label class="field">
			<span>Collection name</span>
			<VInput
				v-model="localName"
				placeholder="e.g. blog_posts"
				data-test="wizard-name-input"
				@keyup.enter="proceed"
			/>
		</label>

		<label class="field checkbox-row">
			<input
				v-model="localSingleton"
				type="checkbox"
				data-test="wizard-singleton-checkbox"
			/>
			<span>This collection holds a single row (singleton)</span>
		</label>

		<p v-if="errorMessage" class="error" data-test="wizard-name-error">{{ errorMessage }}</p>

		<div class="actions">
			<VButton data-test="wizard-name-next" @click="proceed">Next</VButton>
		</div>
	</div>
</template>

<style scoped>
.step-name {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 16px;
	max-width: 480px;
}
.field {
	display: flex;
	flex-direction: column;
	gap: 4px;
}
.checkbox-row {
	flex-direction: row;
	align-items: center;
	gap: 8px;
}
.error {
	color: var(--theme--danger, #c0392b);
	font-size: 13px;
}
.actions {
	display: flex;
	gap: 8px;
}
</style>
