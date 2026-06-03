<script setup lang="ts">
import { useCollection } from '@directus/composables';
import { getEndpoint } from '@directus/utils';
import { isObject, omit } from 'lodash';
import PQueue from 'p-queue';
import { computed, ref, toRefs } from 'vue';
import PrivateViewHeaderBarActionButton from '../private-view/components/private-view-header-bar-action-button.vue';
import api from '@/api';
import VDrawer from '@/components/v-drawer.vue';
import VForm from '@/components/v-form/v-form.vue';
import { VALIDATION_TYPES } from '@/constants';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { APIError } from '@/types/error';
import { fetchAll } from '@/utils/fetch-all';
import { unexpectedError } from '@/utils/unexpected-error';

type TranslationsFieldInfo = {
	field: string;
	creates: Record<string, any>[];
	junctionField: string;
	relatedPkField: string;
};

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

const { internalEdits } = useEdits();
const { internalActive } = useActiveState();
const { save, cancel, saving, validationErrors, itemStates, itemErrors, succeededCount, failedCount } = useActions();

const { collection } = toRefs(props);
const { primaryKeyField } = useCollection(collection);
const { getTranslationsFields, saveBatchWithTranslations } = useTranslationsFields();

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
	const validationErrors = ref([]);

	type ItemState = 'pending' | 'saving' | 'saved' | 'error';
	const itemStates = ref<Record<string, ItemState>>({});
	const itemErrors = ref<Record<string, string>>({});

	const succeededCount = computed(
		() => Object.values(itemStates.value).filter((s) => s === 'saved').length,
	);
	const failedCount = computed(
		() => Object.values(itemStates.value).filter((s) => s === 'error').length,
	);

	function initStates() {
		const states: Record<string, ItemState> = {};
		for (const key of props.primaryKeys) {
			states[String(key)] = 'pending';
		}
		itemStates.value = states;
		itemErrors.value = {};
	}

	return { save, cancel, saving, validationErrors, itemStates, itemErrors, succeededCount, failedCount };

	async function save() {
		if (props.stageOnSave) {
			emit('input', internalEdits.value);
			internalActive.value = false;
			internalEdits.value = {};
			return;
		}

		saving.value = true;
		initStates();

		try {
			const translationsFields = getTranslationsFields(internalEdits.value);

			if (translationsFields.length === 0) {
				const queue = new PQueue({ concurrency: 5 });
				const endpoint = getEndpoint(collection.value);

				await Promise.all(
					props.primaryKeys.map((key) =>
						queue.add(async () => {
							const k = String(key);
							itemStates.value[k] = 'saving';
							try {
								await api.patch(
									`${endpoint}/${encodeURIComponent(k)}`,
									internalEdits.value,
								);
								itemStates.value[k] = 'saved';
							} catch (err: any) {
								itemStates.value[k] = 'error';
								const msg = err?.response?.data?.errors?.[0]?.message || 'Failed';
								itemErrors.value[k] = msg;
							}
						}),
					),
				);

				if (failedCount.value === 0) {
					emit('refresh');
					internalActive.value = false;
					internalEdits.value = {};
				} else if (succeededCount.value > 0) {
					emit('refresh');
				}
			} else {
				await saveBatchWithTranslations(translationsFields);
				emit('refresh');
				internalActive.value = false;
				internalEdits.value = {};
			}
		} catch (error: any) {
			const errors = error?.response?.data?.errors;

			if (!errors) {
				unexpectedError(error);
				return;
			}

			validationErrors.value = errors
				.filter((err: APIError) => VALIDATION_TYPES.includes(err?.extensions?.code))
				.map((err: APIError) => {
					return err.extensions;
				});

			const otherErrors = errors.filter((err: APIError) => VALIDATION_TYPES.includes(err?.extensions?.code) === false);

			if (otherErrors.length > 0) {
				otherErrors.forEach(unexpectedError);
			}
		} finally {
			saving.value = false;
		}
	}

	function cancel() {
		internalActive.value = false;
		internalEdits.value = {};
		itemStates.value = {};
		itemErrors.value = {};
	}
}

function useTranslationsFields() {
	const fieldsStore = useFieldsStore();
	const relationsStore = useRelationsStore();

	return { getTranslationsFields, saveBatchWithTranslations };

	function getTranslationsFields(edits: Record<string, any>): TranslationsFieldInfo[] {
		const results: TranslationsFieldInfo[] = [];

		for (const [key, value] of Object.entries(edits)) {
			// Batch mode form (primary-key="+") only produces `create` operations for relational fields.
			if (!isObject(value) || !('create' in value)) continue;

			const fieldInfo = fieldsStore.getField(collection.value, key);
			if (!fieldInfo?.meta?.special?.includes('translations')) continue;

			const relations = relationsStore.getRelationsForField(collection.value, key);
			const junctionRelation = relations.find((r) => r.meta?.one_field === key);
			const junctionField = junctionRelation?.meta?.junction_field;

			if (!junctionField) continue;

			const relatedCollection = relations.find((r) => r.field === junctionField)?.related_collection;

			const relatedPkField = relatedCollection
				? fieldsStore.getPrimaryKeyFieldForCollection(relatedCollection)?.field
				: null;

			if (!relatedPkField) continue;

			results.push({
				field: key,
				creates: (value as any).create as Record<string, any>[],
				junctionField,
				relatedPkField,
			});
		}

		return results;
	}

	async function saveBatchWithTranslations(translationsFields: TranslationsFieldInfo[]) {
		const otherEdits = omit(
			internalEdits.value,
			translationsFields.map((t) => t.field),
		);

		if (!primaryKeyField.value) {
			throw new Error(`No primary key field found for collection ${collection.value}`);
		}

		const pkField = primaryKeyField.value.field;
		const endpoint = getEndpoint(collection.value);

		const existingItems = await fetchAll<Record<string, any>>(endpoint, {
			params: {
				filter: { [pkField]: { _in: props.primaryKeys } },
				fields: [pkField, ...translationsFields.map((t) => `${t.field}.*`)],
			},
		});

		const itemMap = new Map(existingItems.map((item) => [item[pkField], item]));
		const resolveId = (val: unknown, field: string) => (isObject(val) ? (val as Record<string, any>)[field] : val);

		const payload = props.primaryKeys
			.filter((pk) => itemMap.has(pk))
			.map((pk) => {
				const item: Record<string, any> = { [pkField]: pk, ...otherEdits };

				for (const { field, creates, junctionField, relatedPkField } of translationsFields) {
					const merged = new Map(
						(itemMap.get(pk)![field] || []).map((row: Record<string, any>) => [
							resolveId(row[junctionField], relatedPkField),
							row,
						]),
					);

					for (const create of creates) {
						const id = resolveId(create[junctionField], relatedPkField);
						merged.set(id, { ...(merged.get(id) ?? {}), ...create });
					}

					item[field] = [...merged.values()];
				}

				return item;
			});

		await api.patch(endpoint, payload);
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
			<PrivateViewHeaderBarActionButton v-tooltip.bottom="$t('save')" :loading="saving" icon="check" @click="save" />
		</template>

		<div class="drawer-batch-content">
			<div
				v-if="saving || succeededCount > 0 || failedCount > 0"
				class="batch-rollup"
				data-testid="batch-rollup"
			>
				<div class="batch-rollup-header" data-testid="batch-rollup-header">
					{{ succeededCount }} of {{ primaryKeys.length }} succeeded<span v-if="failedCount > 0">
						· {{ failedCount }} failed</span>
				</div>
				<div class="batch-item-list">
					<div
						v-for="key in primaryKeys"
						:key="String(key)"
						class="batch-item-row"
						data-testid="batch-item-row"
						:data-item-key="String(key)"
						:data-state="itemStates[String(key)] || 'pending'"
					>
						<span class="batch-item-key">{{ key }}</span>
						<span class="batch-item-state">{{ itemStates[String(key)] || 'pending' }}</span>
						<span v-if="itemErrors[String(key)]" class="batch-item-error">
							{{ itemErrors[String(key)] }}
						</span>
					</div>
				</div>
			</div>

			<VForm
				v-model="internalEdits"
				:collection="collection"
				batch-mode
				primary-key="+"
				:validation-errors="validationErrors"
			/>
		</div>
	</VDrawer>
</template>

<style lang="scss" scoped>
.v-divider {
	margin: 2.9375rem 0;
}

.drawer-batch-content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}
</style>
