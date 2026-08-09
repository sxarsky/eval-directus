<script setup lang="ts">
import { ref } from 'vue';
import StepMappings from './steps/step-mappings.vue';
import StepReview from './steps/step-review.vue';
import StepUpload from './steps/step-upload.vue';
import { useImportWizardStore } from '@/stores/import-wizard';

const store = useImportWizardStore();
const currentStep = ref(1);

function onNext() {
	// Advance to the next step. Step components emit their payload via the
	// `next` event, but the wizard doesn't capture it here -- each step is
	// expected to write its own state into the Pinia store.
	currentStep.value = Math.min(3, currentStep.value + 1);
}

function onBack() {
	currentStep.value = Math.max(1, currentStep.value - 1);
}

function onComplete() {
	// Placeholder: emit the wizard payload + reset.
	// In a real impl we'd POST {file, mappings} to /utils/import here.
	store.reset();
	currentStep.value = 1;
}
</script>

<template>
	<div class="import-wizard">
		<header data-test="wizard-step-indicator">Step {{ currentStep }} of 3</header>
		<StepUpload v-if="currentStep === 1" @next="onNext" />
		<StepMappings v-else-if="currentStep === 2" @next="onNext" @back="onBack" />
		<StepReview v-else-if="currentStep === 3" @back="onBack" @complete="onComplete" />
	</div>
</template>

<style scoped>
.import-wizard {
	padding: 16px;
	max-width: 720px;
}
header {
	font-weight: 600;
	margin-bottom: 12px;
}
</style>
