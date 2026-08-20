<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
	items: string[];
}>();

const emit = defineEmits<{
	(e: 'select', value: string): void;
	(e: 'close'): void;
}>();

const activeIndex = ref(0);
const itemRefs = ref<(HTMLElement | null)[]>([]);

watch(
	() => props.items,
	() => {
		activeIndex.value = 0;
	},
);

function focusFirst() {
	activeIndex.value = 0;
	itemRefs.value[0]?.focus();
}

function onKeydown(event: KeyboardEvent) {
	if (event.key === 'ArrowDown') {
		event.preventDefault();
		activeIndex.value = Math.min(activeIndex.value + 1, props.items.length - 1);
		itemRefs.value[activeIndex.value]?.focus();
	} else if (event.key === 'ArrowUp') {
		event.preventDefault();
		activeIndex.value = Math.max(activeIndex.value - 1, 0);
		itemRefs.value[activeIndex.value]?.focus();
	} else if (event.key === 'Enter') {
		event.preventDefault();
		emit('select', props.items[activeIndex.value]!);
	} else if (event.key === 'Escape') {
		event.preventDefault();
		emit('close');
	}
}

defineExpose({ focusFirst });
</script>

<template>
	<ul
		v-if="items.length > 0"
		role="listbox"
		data-testid="search-results"
		class="search-results"
		@keydown="onKeydown"
	>
		<li
			v-for="(item, index) in items"
			:key="item"
			:ref="(el) => (itemRefs[index] = el as HTMLElement | null)"
			role="option"
			data-testid="search-result-item"
			:tabindex="index === activeIndex ? 0 : -1"
			@focus="activeIndex = index"
			@click="emit('select', item)"
		>
			{{ item }}
		</li>
	</ul>
</template>

<style scoped>
.search-results {
	position: absolute;
	inset-block-start: 100%;
	inset-inline: 0;
	z-index: 10;
	margin: 0;
	padding: 4px 0;
	list-style: none;
	background-color: var(--theme--background);
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
}

.search-results li {
	padding: 8px 12px;
	cursor: pointer;
}

.search-results li:focus {
	outline: none;
	background-color: var(--theme--background-subdued);
}
</style>
