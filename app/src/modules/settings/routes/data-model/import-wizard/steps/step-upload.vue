<script setup lang="ts">
import { ref } from 'vue';
import VButton from '@/components/v-button.vue';
import VInput from '@/components/v-input.vue';
import { useImportWizardStore } from '@/stores/import-wizard';

const emit = defineEmits(['next']);
const store = useImportWizardStore();
const fileName = ref('');
const columns = ref<string[]>([]);

function parseColumns(raw: string): string[] {
	const firstLine = raw.split('\n')[0] ?? '';
	return firstLine
		.split(',')
		.map((c) => c.trim())
		.filter(Boolean);
}

function onFileChange(event: Event) {
	const target = event.target as HTMLInputElement;
	const file = target.files?.[0];
	if (!file) return;
	fileName.value = file.name;
	file.text().then((text) => {
		columns.value = parseColumns(text);
	});
}

function proceed() {
	if (columns.value.length === 0) return;
	store.setUpload(fileName.value, columns.value);
	emit('next');
}
</script>

<template>
	<div class="step-upload">
		<h3>Step 1 — Upload CSV</h3>
		<VInput v-model="fileName" placeholder="Or enter a filename" data-test="upload-filename" />
		<input type="file" accept=".csv" data-test="upload-file-picker" @change="onFileChange" />
		<p v-if="columns.length > 0">Detected {{ columns.length }} columns: {{ columns.join(', ') }}</p>
		<VButton :disabled="columns.length === 0" data-test="upload-next" @click="proceed">Next</VButton>
	</div>
</template>
