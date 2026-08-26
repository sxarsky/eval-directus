<script setup lang="ts">
import { getEndpoint } from '@directus/utils';
import PQueue from 'p-queue';
import { computed, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import PrivateViewHeaderBarActionButton from '../private-view/components/private-view-header-bar-action-button.vue';
import DrawerBatchItem from './drawer-batch-item.vue';
import api from '@/api';
import VDrawer from '@/components/v-drawer.vue';
import VForm from '@/components/v-form/v-form.vue';
import { useBatchRollup } from '@/composables/use-batch-rollup';
import { VALIDATION_TYPES } from '@/constants';
import { APIError } from '@/types/error';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';

// Cap concurrent per-item PATCHes so a large selection doesn't flood the API (DR-UC06).
const BATCH_CONCURRENCY = 5;

const props = defineProps<{
	collection: string;
	primaryKeys: (number | string)[];
	active?: boolean;
	edits?: Record<string, any>;
	stageOnSave?: boolean;
}>();

const emit = defineEmits<{
	(e: 'update:active', value: boolean): void;
	(e: 'refresh'): void;
	(e: 'input', value: Record<string, any>): void;
}>();

const { t } = useI18n();

const { collection } = toRefs(props);

const { internalEdits } = useEdits();
const { internalActive } = useActiveState();
const rollup = useBatchRollup();
const { save, cancel, saving, validationErrors, retryItem } = useActions();

// Seed the per-item rollup as pending when the drawer opens; clear it when it closes.
watch(
	internalActive,
	(active) => {
		if (active) rollup.init(props.primaryKeys);
		else rollup.reset();
	},
	{ immediate: true },
);

// Template-facing helpers (nested refs/getters don't auto-unwrap in the template).
const rollupHeader = computed(() => t('batch_rollup_header', { count: rollup.savedCount.value, total: rollup.total.value }));
const itemState = (pk: number | string) => rollup.get(pk);

function useEdits() {
	const localEdits = ref<Record<string, any>>({});

	const internalEdits = computed<Record<string, any>>({
		get() {
			if (props.edits !== undefined) {
				return {
					...props.edits,
					...localEdits.value,
				};
			}

			return localEdits.value;
		},
		set(newEdits) {
			localEdits.value = newEdits;
		},
	});

	return { internalEdits };
}

function useActiveState() {
	const localActive = ref(false);

	const internalActive = computed({
		get() {
			return props.active === undefined ? localActive.value : props.active;
		},
		set(newActive: boolean) {
			localActive.value = newActive;
			emit('update:active', newActive);
		},
	});

	return { internalActive };
}

function useActions() {
	const saving = ref(false);
	const validationErrors = ref<any[]>([]);

	return { save, cancel, saving, validationErrors, retryItem };

	async function save() {
		if (props.stageOnSave) {
			emit('input', internalEdits.value);
			internalActive.value = false;
			internalEdits.value = {};
			return;
		}

		validationErrors.value = [];
		rollup.init(props.primaryKeys);
		saving.value = true;

		// Dispatch N concurrent per-item PATCHes (concurrency-capped); collect per-item outcomes.
		const queue = new PQueue({ concurrency: BATCH_CONCURRENCY });
		await Promise.all(props.primaryKeys.map((pk) => queue.add(() => saveItem(pk))));

		saving.value = false;
		emit('refresh');
		reportOutcome();

		// Close only when every item succeeded; otherwise stay open so failed rows can be retried.
		if (rollup.errorCount.value === 0) {
			internalActive.value = false;
			internalEdits.value = {};
		}
	}

	async function saveItem(pk: number | string) {
		rollup.set(pk, 'saving');

		try {
			await api.patch(`${getEndpoint(collection.value)}/${encodeURIComponent(String(pk))}`, internalEdits.value);
			rollup.set(pk, 'saved');
		} catch (error: any) {
			rollup.set(pk, 'error');
			collectValidationErrors(error);
		}
	}

	async function retryItem(pk: number | string) {
		saving.value = true;
		await saveItem(pk);
		saving.value = false;
		emit('refresh');
		reportOutcome();

		if (rollup.errorCount.value === 0) {
			internalActive.value = false;
			internalEdits.value = {};
		}
	}

	function reportOutcome() {
		const total = rollup.total.value;
		const saved = rollup.savedCount.value;

		if (saved === total) {
			notify({ title: t('batch_rollup_all_success', { total }) });
		} else if (saved === 0) {
			notify({ title: t('batch_rollup_all_error'), type: 'error' });
		} else {
			notify({ title: t('batch_rollup_partial', { count: saved, total }), type: 'warning' });
		}
	}

	function collectValidationErrors(error: any) {
		const errors = error?.response?.data?.errors;
		if (!errors) return;

		const seen = new Set(validationErrors.value.map((e: any) => e?.field));

		for (const err of errors as APIError[]) {
			if (VALIDATION_TYPES.includes(err?.extensions?.code)) {
				const field = (err.extensions as any)?.field;
				if (!seen.has(field)) {
					seen.add(field);
					validationErrors.value = [...validationErrors.value, err.extensions];
				}
			} else {
				unexpectedError(err);
			}
		}
	}

	function cancel() {
		internalActive.value = false;
		internalEdits.value = {};
	}
}
</script>

<template>
	<VDrawer
		v-model="internalActive"
		:title="$t('editing_in_batch', { count: primaryKeys.length })"
		persistent
		@cancel="cancel"
		@apply="save"
	>
		<template #actions>
			<PrivateViewHeaderBarActionButton
				v-tooltip.bottom="$t('save')"
				:loading="saving"
				:disabled="saving"
				icon="check"
				@click="save"
			/>
		</template>

		<div class="drawer-batch-content">
			<VForm
				v-model="internalEdits"
				:collection="collection"
				batch-mode
				primary-key="+"
				:validation-errors="validationErrors"
			/>

			<div class="batch-rollup">
				<div class="rollup-header" data-testid="batch-rollup-header">{{ rollupHeader }}</div>
				<DrawerBatchItem
					v-for="pk in primaryKeys"
					:key="pk"
					:item-key="pk"
					:state="itemState(pk)"
					@retry="retryItem(pk)"
				/>
			</div>
		</div>
	</VDrawer>
</template>

<style lang="scss" scoped>
.v-divider {
	margin: 52px 0;
}

.drawer-batch-content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}

.batch-rollup {
	margin-block-start: 2rem;

	.rollup-header {
		margin-block-end: 0.5rem;
		color: var(--theme--foreground-subdued);
		font-weight: 600;
	}
}
</style>
