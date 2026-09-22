<script setup lang="ts">
import { computed, ref } from 'vue';
import VButton from '@/components/v-button.vue';
import { useCollectionsStore } from '@/stores/collections';

const emit = defineEmits(['next', 'back']);
const collectionsStore = useCollectionsStore();

// Show only user collections (skip system collections).
const collectionKeys = computed(() =>
	collectionsStore.allCollections
		.filter((c) => c.meta && !c.collection.startsWith('directus_'))
		.map((c) => c.collection),
);

// Local-only checkbox state. Emitted via the `next` event when the user
// advances, but the wizard parent's onNext handler doesn't capture the
// payload -- the bulk-tag store never sees these selections.
const localChecked = ref<Record<string, boolean>>({});

function toggle(key: string) {
	localChecked.value = { ...localChecked.value, [key]: !localChecked.value[key] };
}

const selectedCount = computed(
	() => Object.values(localChecked.value).filter(Boolean).length,
);

function proceed() {
	if (selectedCount.value === 0) return;
	const selectedKeys = Object.entries(localChecked.value)
		.filter(([, checked]) => checked)
		.map(([key]) => key);
	emit('next', selectedKeys);
}
</script>

<template>
	<div class="step-select-collections">
		<h3>Step 2 — Select collections</h3>
		<p>Choose the collections that should receive the new tag.</p>

		<ul class="collection-list" data-test="collection-list">
			<li v-for="key in collectionKeys" :key="key" class="collection-row">
				<label>
					<input
						type="checkbox"
						:checked="!!localChecked[key]"
						:data-test="`collection-checkbox-${key}`"
						@change="toggle(key)"
					/>
					{{ key }}
				</label>
			</li>
		</ul>

		<p data-test="selected-count">{{ selectedCount }} selected</p>

		<div class="actions">
			<VButton secondary data-test="collections-back" @click="emit('back')">Back</VButton>
			<VButton
				:disabled="selectedCount === 0"
				data-test="collections-next"
				@click="proceed"
			>
				Next
			</VButton>
		</div>
	</div>
</template>

<style scoped>
.collection-list {
	list-style: none;
	padding: 0;
	margin: 8px 0;
	max-height: 320px;
	overflow-y: auto;
}
.collection-row {
	margin: 4px 0;
}
.actions {
	margin-top: 12px;
	display: flex;
	gap: 8px;
}
</style>
