<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VInput from '@/components/v-input.vue';
import VNotice from '@/components/v-notice.vue';
import { Collection } from '@/types/collections';

const props = defineProps<{
	modelValue?: boolean;
	collection: Collection;
}>();

const emit = defineEmits(['update:modelValue', 'rename']);

const TAG_NAME_MIN = 3;
const TAG_NAME_MAX = 50;

const newName = ref('');

// Reset the input each time the dialog opens.
watch(
	() => props.modelValue,
	(isOpen) => {
		if (isOpen) {
			newName.value = props.collection.meta?.tag ?? '';
		}
	},
);

const validationError = computed<string | null>(() => {
	const len = newName.value.length;
	if (len < TAG_NAME_MIN) {
		return `Tag name must be at least ${TAG_NAME_MIN} characters.`;
	}
	if (len >= TAG_NAME_MAX) {
		return `Tag name must be at most ${TAG_NAME_MAX} characters.`;
	}
	return null;
});

const canSubmit = computed(() => validationError.value === null);

function close() {
	emit('update:modelValue', false);
}

function submit() {
	if (!canSubmit.value) return;
	emit('rename', newName.value);
	close();
}
</script>

<template>
	<VDialog :model-value="modelValue" @update:model-value="close" @esc="close">
		<VCard>
			<VCardTitle>Rename collection tag</VCardTitle>
			<VCardText>
				<VInput
					v-model="newName"
					autofocus
					placeholder="Enter a tag name (3-50 characters)"
					data-test="tag-rename-input"
				/>
				<VNotice v-if="validationError" type="warning" data-test="tag-rename-error">
					{{ validationError }}
				</VNotice>
			</VCardText>
			<VCardActions>
				<VButton secondary @click="close">Cancel</VButton>
				<VButton :disabled="!canSubmit" data-test="tag-rename-submit" @click="submit">Rename</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
</template>
