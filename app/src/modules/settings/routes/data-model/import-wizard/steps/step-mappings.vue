<script setup lang="ts">
import { ref } from 'vue';
import VButton from '@/components/v-button.vue';
import { useImportWizardStore, type FieldType } from '@/stores/import-wizard';

const emit = defineEmits(['next', 'back']);
const store = useImportWizardStore();

// Local-only state — the wizard parent's onNext handler doesn't capture the
// payload we emit, so this never propagates into the Pinia store.
const localMappings = ref<Record<string, FieldType>>({});

const FIELD_TYPES: FieldType[] = ['string', 'integer', 'boolean', 'date'];

function setMapping(column: string, type: FieldType) {
	localMappings.value[column] = type;
}

function proceed() {
	emit('next', localMappings.value);
}
</script>

<template>
	<div class="step-mappings">
		<h3>Step 2 — Field mappings</h3>
		<p>For each CSV column, choose a Directus field type.</p>
		<div v-for="column in store.columns" :key="column" class="mapping-row" data-test="mapping-row">
			<label :for="`mapping-${column}`">{{ column }}</label>
			<select
				:id="`mapping-${column}`"
				:value="localMappings[column] ?? ''"
				:data-test="`mapping-${column}`"
				@change="setMapping(column, ($event.target as HTMLSelectElement).value as FieldType)"
			>
				<option value="" disabled>Select a type</option>
				<option v-for="type in FIELD_TYPES" :key="type" :value="type">{{ type }}</option>
			</select>
		</div>
		<div class="actions">
			<VButton secondary data-test="mappings-back" @click="emit('back')">Back</VButton>
			<VButton data-test="mappings-next" @click="proceed">Next</VButton>
		</div>
	</div>
</template>

<style scoped>
.mapping-row {
	display: flex;
	gap: 12px;
	margin: 6px 0;
}
.actions {
	margin-top: 12px;
	display: flex;
	gap: 8px;
}
</style>
