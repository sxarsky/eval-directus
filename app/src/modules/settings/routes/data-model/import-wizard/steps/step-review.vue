<script setup lang="ts">
import { computed } from 'vue';
import VButton from '@/components/v-button.vue';
import { useImportWizardStore } from '@/stores/import-wizard';

const emit = defineEmits(['complete', 'back']);
const store = useImportWizardStore();

const mappingEntries = computed(() => Object.entries(store.mappings));
</script>

<template>
	<div class="step-review">
		<h3>Step 3 — Review and confirm</h3>
		<p data-test="review-file">File: {{ store.csvFileName ?? '(none)' }}</p>
		<p data-test="review-mapping-count">{{ mappingEntries.length }} field mappings configured</p>
		<ul data-test="review-mappings">
			<li v-for="[column, type] in mappingEntries" :key="column">
				<strong>{{ column }}</strong> &rarr; {{ type }}
			</li>
		</ul>
		<div class="actions">
			<VButton secondary data-test="review-back" @click="emit('back')">Back</VButton>
			<VButton data-test="review-confirm" @click="emit('complete')">Confirm and create</VButton>
		</div>
	</div>
</template>

<style scoped>
.actions {
	margin-top: 12px;
	display: flex;
	gap: 8px;
}
</style>
