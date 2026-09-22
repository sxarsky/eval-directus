<script setup lang="ts">
import { ref } from 'vue';
import VButton from '@/components/v-button.vue';
import VInput from '@/components/v-input.vue';
import { useBulkTagWizardStore } from '@/stores/bulk-tag-wizard';

const emit = defineEmits(['next']);
const store = useBulkTagWizardStore();
const localName = ref(store.tagName);
const localColor = ref(store.tagColor);

function proceed() {
	if (localName.value.trim().length === 0) return;
	store.setTagInfo(localName.value.trim(), localColor.value);
	emit('next');
}
</script>

<template>
	<div class="step-tag-info">
		<h3>Step 1 — Tag info</h3>
		<p>Pick a name and color for the new tag.</p>

		<label class="field">
			<span>Tag name</span>
			<VInput v-model="localName" placeholder="e.g. core-content" data-test="tag-info-name" />
		</label>

		<label class="field">
			<span>Tag color</span>
			<input
				v-model="localColor"
				type="color"
				data-test="tag-info-color"
				aria-label="Tag color"
			/>
		</label>

		<div class="actions">
			<VButton
				:disabled="localName.trim().length === 0"
				data-test="tag-info-next"
				@click="proceed"
			>
				Next
			</VButton>
		</div>
	</div>
</template>

<style scoped>
.field {
	display: flex;
	flex-direction: column;
	gap: 4px;
	margin: 8px 0;
}
.actions {
	margin-top: 12px;
	display: flex;
	gap: 8px;
}
</style>
