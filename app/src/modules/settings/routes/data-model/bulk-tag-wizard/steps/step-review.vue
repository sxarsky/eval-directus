<script setup lang="ts">
import { computed } from 'vue';
import VButton from '@/components/v-button.vue';
import { useBulkTagWizardStore } from '@/stores/bulk-tag-wizard';

const emit = defineEmits(['complete', 'back']);
const store = useBulkTagWizardStore();

const selectedCount = computed(() => store.selectedCollections.length);
</script>

<template>
	<div class="step-review">
		<h3>Step 3 — Review and confirm</h3>

		<p data-test="review-tag-name">
			Tag name: <strong>{{ store.tagName || '(none)' }}</strong>
		</p>

		<p data-test="review-tag-color" class="color-row">
			Tag color:
			<span class="color-swatch" :style="{ backgroundColor: store.tagColor }" />
			<code>{{ store.tagColor }}</code>
		</p>

		<p data-test="review-collection-count">
			{{ selectedCount }} collections selected
		</p>

		<ul data-test="review-collection-list">
			<li v-for="collection in store.selectedCollections" :key="collection">
				{{ collection }}
			</li>
		</ul>

		<div class="actions">
			<VButton secondary data-test="review-back" @click="emit('back')">Back</VButton>
			<VButton data-test="review-confirm" @click="emit('complete')">Confirm and apply</VButton>
		</div>
	</div>
</template>

<style scoped>
.color-row {
	display: flex;
	align-items: center;
	gap: 6px;
}
.color-swatch {
	display: inline-block;
	width: 14px;
	height: 14px;
	border-radius: 3px;
	border: 1px solid var(--theme--border-color, #ccc);
}
.actions {
	margin-top: 12px;
	display: flex;
	gap: 8px;
}
</style>
