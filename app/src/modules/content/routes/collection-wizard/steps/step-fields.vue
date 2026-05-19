<script setup lang="ts">
import { ref } from 'vue';
import VButton from '@/components/v-button.vue';
import VInput from '@/components/v-input.vue';
import { useCollectionWizardStore } from '@/stores/collection-wizard';
import { validateStepFields } from '../validate';

const emit = defineEmits(['next', 'back']);
const store = useCollectionWizardStore();

const fieldTypes = ['string', 'text', 'integer', 'bigInteger', 'float', 'boolean', 'date', 'dateTime', 'json', 'uuid'];

const rows = ref(store.fields.length > 0 ? [...store.fields] : [{ field: '', type: 'string' }]);
const errorMessage = ref<string | null>(null);

function addRow() {
	rows.value = [...rows.value, { field: '', type: 'string' }];
}

function removeRow(index: number) {
	rows.value = rows.value.filter((_, i) => i !== index);
}

function proceed() {
	const err = validateStepFields({ fields: rows.value });
	if (err) {
		errorMessage.value = err;
		return;
	}
	errorMessage.value = null;
	store.setFields([...rows.value]);
	emit('next');
}
</script>

<template>
	<div class="step-fields">
		<h3>Step 2 — Field definitions</h3>

		<div class="rows" data-test="wizard-fields-rows">
			<div v-for="(row, idx) in rows" :key="idx" class="row">
				<VInput
					v-model="row.field"
					placeholder="field_name"
					:data-test="`wizard-fields-name-${idx}`"
				/>
				<select v-model="row.type" :data-test="`wizard-fields-type-${idx}`">
					<option v-for="t in fieldTypes" :key="t" :value="t">{{ t }}</option>
				</select>
				<VButton
					v-if="rows.length > 1"
					secondary
					:data-test="`wizard-fields-remove-${idx}`"
					@click="removeRow(idx)"
				>
					Remove
				</VButton>
			</div>
		</div>

		<VButton secondary data-test="wizard-fields-add-row" @click="addRow">+ Add field</VButton>

		<p v-if="errorMessage" class="error" data-test="wizard-fields-error">{{ errorMessage }}</p>

		<div class="actions">
			<VButton secondary data-test="wizard-fields-back" @click="emit('back')">Back</VButton>
			<VButton data-test="wizard-fields-next" @click="proceed">Next</VButton>
		</div>
	</div>
</template>

<style scoped>
.step-fields {
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
	grid-template-columns: 1fr 180px auto;
	gap: 8px;
	align-items: center;
}
.error {
	color: var(--theme--danger, #c0392b);
	font-size: 13px;
}
.actions {
	display: flex;
	gap: 8px;
	margin-top: 8px;
}
</style>
