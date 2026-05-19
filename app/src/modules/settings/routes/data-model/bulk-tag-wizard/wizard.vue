<script setup lang="ts">
import { ref } from 'vue';
import StepReview from './steps/step-review.vue';
import StepSelectCollections from './steps/step-select-collections.vue';
import StepTagInfo from './steps/step-tag-info.vue';
import { useBulkTagWizardStore } from '@/stores/bulk-tag-wizard';

const store = useBulkTagWizardStore();
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
	// Stub: real implementation would iterate store.selectedCollections and
	// call collectionsStore.updateCollection(key, { meta: { tag: store.tagName } }).
	store.reset();
	currentStep.value = 1;
}
</script>

<template>
	<div class="bulk-tag-wizard">
		<header data-test="wizard-step-indicator">Step {{ currentStep }} of 3</header>
		<StepTagInfo v-if="currentStep === 1" @next="onNext" />
		<StepSelectCollections v-else-if="currentStep === 2" @next="onNext" @back="onBack" />
		<StepReview v-else-if="currentStep === 3" @back="onBack" @complete="onComplete" />
	</div>
</template>

<style scoped>
.bulk-tag-wizard {
	padding: 16px;
	max-width: 720px;
}
header {
	font-weight: 600;
	margin-bottom: 12px;
}
</style>
