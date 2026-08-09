<script setup lang="ts">
import { computed, ref } from 'vue';
import VButton from '@/components/v-button.vue';
import VInput from '@/components/v-input.vue';
import { useCollectionsStore } from '@/stores/collections';
import { useCollectionWizardStore } from '@/stores/collection-wizard';

const emit = defineEmits(['next', 'back']);
const store = useCollectionWizardStore();
const collectionsStore = useCollectionsStore();

const relations = ref(
	store.relations.length > 0 ? [...store.relations] : [{ field: '', relatedCollection: '' }],
);

const availableCollections = computed(() =>
	collectionsStore.allCollections
		.filter((c) => !c.collection.startsWith('directus_'))
		.map((c) => c.collection),
);

function addRow() {
	relations.value = [...relations.value, { field: '', relatedCollection: '' }];
}

function removeRow(index: number) {
	relations.value = relations.value.filter((_, i) => i !== index);
}

function proceed() {
	// Filter out empty rows -- Relations are optional for this step.
	const filled = relations.value.filter(
		(r) => r.field.trim() !== '' && r.relatedCollection.trim() !== '',
	);
	store.setRelations(filled);
	emit('next');
}
</script>

<template>
	<div class="step-relations">
		<h3>Step 3 — Relations</h3>
		<p>Optionally link this collection to other collections.</p>

		<div class="rows" data-test="wizard-relations-rows">
			<div v-for="(row, idx) in relations" :key="idx" class="row">
				<VInput
					v-model="row.field"
					placeholder="field_name"
					:data-test="`wizard-relations-field-${idx}`"
				/>
				<select v-model="row.relatedCollection" :data-test="`wizard-relations-target-${idx}`">
					<option value="">— select related collection —</option>
					<option v-for="c in availableCollections" :key="c" :value="c">{{ c }}</option>
				</select>
				<VButton
					v-if="relations.length > 1"
					secondary
					:data-test="`wizard-relations-remove-${idx}`"
					@click="removeRow(idx)"
				>
					Remove
				</VButton>
			</div>
		</div>

		<VButton secondary data-test="wizard-relations-add-row" @click="addRow">+ Add relation</VButton>

		<div class="actions">
			<VButton secondary data-test="wizard-relations-back" @click="emit('back')">Back</VButton>
			<VButton data-test="wizard-relations-next" @click="proceed">Next</VButton>
		</div>
	</div>
</template>

<style scoped>
.step-relations {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 16px;
	max-width: 560px;
}
.rows {
	display: flex;
	flex-direction: column;
	gap: 8px;
}
.row {
	display: grid;
	grid-template-columns: 1fr 220px auto;
	gap: 8px;
	align-items: center;
}
.actions {
	display: flex;
	gap: 8px;
	margin-top: 8px;
}
</style>
