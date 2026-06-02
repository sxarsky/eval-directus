<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';

// DR-U19: roving-tabindex list with ArrowDown/Up navigation, Enter activation, Escape dismissal.
// Hosts a small "search suggestions" list as a results dropdown for the search input.

interface SearchResultItem {
	id: string;
	label: string;
	hint?: string;
}

const props = withDefaults(
	defineProps<{
		items: SearchResultItem[];
		active: boolean;
	}>(),
	{ active: false },
);

const emit = defineEmits<{
	(e: 'select', item: SearchResultItem): void;
	(e: 'close'): void;
}>();

const activeIndex = ref(0);
const itemRefs = ref<HTMLElement[]>([]);

const visibleItems = computed(() => props.items);

watch(
	() => props.items.length,
	(len) => {
		if (activeIndex.value >= len) activeIndex.value = Math.max(0, len - 1);
	},
);

watch(
	() => props.active,
	(isActive) => {
		if (isActive) {
			activeIndex.value = 0;
		}
	},
);

function getTabIndex(index: number) {
	// Roving tabindex: only the active item is tab-reachable
	return index === activeIndex.value ? 0 : -1;
}

async function focusItemAt(index: number) {
	const clamped = Math.max(0, Math.min(index, visibleItems.value.length - 1));
	activeIndex.value = clamped;
	await nextTick();
	itemRefs.value[clamped]?.focus();
}

function moveDown() {
	if (visibleItems.value.length === 0) return;
	focusItemAt(activeIndex.value + 1);
}

function moveUp() {
	if (visibleItems.value.length === 0) return;
	focusItemAt(activeIndex.value - 1);
}

function onKeyDown(event: KeyboardEvent) {
	if (event.key === 'ArrowDown') {
		event.preventDefault();
		moveDown();
	} else if (event.key === 'ArrowUp') {
		event.preventDefault();
		moveUp();
	} else if (event.key === 'Enter') {
		event.preventDefault();
		const item = visibleItems.value[activeIndex.value];
		if (item) emit('select', item);
	} else if (event.key === 'Escape') {
		event.preventDefault();
		emit('close');
	}
	// Tab is intentionally not intercepted — default browser tab-out behavior
	// moves focus to the next focusable element outside this composite widget.
}

// Exposed for parent: focus the first result (e.g. when ArrowDown is pressed from the input)
function focusFirst() {
	focusItemAt(0);
}

defineExpose({ focusFirst });
</script>

<template>
	<ul
		v-if="active && visibleItems.length > 0"
		class="search-results"
		role="listbox"
		data-testid="search-results"
		@keydown="onKeyDown"
	>
		<li
			v-for="(item, index) in visibleItems"
			:key="item.id"
			:ref="(el) => { if (el) itemRefs[index] = el as HTMLElement; }"
			class="search-result-item"
			role="option"
			:tabindex="getTabIndex(index)"
			:aria-selected="index === activeIndex"
			:data-active="index === activeIndex"
			data-testid="search-result-item"
			@click="emit('select', item)"
			@focus="activeIndex = index"
		>
			<span class="label">{{ item.label }}</span>
			<span v-if="item.hint" class="hint">{{ item.hint }}</span>
		</li>
	</ul>
</template>

<style lang="scss" scoped>
.search-results {
	position: absolute;
	inset-block-start: calc(100% + 0.25rem);
	inset-inline-end: 0;
	inline-size: 16rem;
	max-block-size: 18rem;
	margin: 0;
	padding: 0.25rem 0;
	overflow-y: auto;
	list-style: none;
	background-color: var(--theme--background-subdued);
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	box-shadow: 0 0.25rem 0.75rem rgb(0 0 0 / 8%);
	z-index: 20;
}

.search-result-item {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 0.75rem;
	color: var(--theme--foreground);
	cursor: pointer;
	outline: none;

	&:hover,
	&[data-active='true'] {
		background-color: var(--theme--background-normal);
	}

	&:focus-visible {
		background-color: var(--theme--background-normal);
		outline: 0.125rem solid var(--theme--primary);
		outline-offset: -0.125rem;
	}

	.label {
		flex-grow: 1;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}

	.hint {
		color: var(--theme--foreground-subdued);
		font-size: 0.75rem;
	}
}
</style>
