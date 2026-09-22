<script setup lang="ts">
import { computed } from 'vue';
import VButton from '@/components/v-button.vue';
import { useCollectionWizardStore } from '@/stores/collection-wizard';

const emit = defineEmits(['back', 'confirm']);
const store = useCollectionWizardStore();

const allowedPermissions = computed(() => store.permissions.filter((p) => p.allow));
</script>

<template>
	<div class="step-review">
		<h3>Step 5 — Review &amp; confirm</h3>

		<section data-test="review-summary-name">
			<strong>Collection:</strong> {{ store.name || '(not set)' }}
			<span v-if="store.singleton" class="tag">singleton</span>
		</section>

		<section data-test="review-summary-fields">
			<strong>{{ store.fields.length }} fields</strong>
			<ul>
				<li v-for="f in store.fields" :key="f.field">{{ f.field }} <em>({{ f.type }})</em></li>
			</ul>
		</section>

		<section data-test="review-summary-relations">
			<strong>{{ store.relations.length }} relations</strong>
			<ul>
				<li v-for="r in store.relations" :key="r.field">
					{{ r.field }} → {{ r.relatedCollection }}
				</li>
			</ul>
		</section>

		<section data-test="review-summary-permissions">
			<strong>{{ allowedPermissions.length }} permission grants</strong>
			<ul>
				<li v-for="(p, idx) in allowedPermissions" :key="idx">
					{{ p.role ?? '(public)' }}: {{ p.action }}
				</li>
			</ul>
		</section>

		<div class="actions">
			<VButton secondary data-test="review-back" @click="emit('back')">Back</VButton>
			<VButton data-test="review-confirm" @click="emit('confirm')">Confirm and create</VButton>
		</div>
	</div>
</template>

<style scoped>
.step-review {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 16px;
	max-width: 560px;
}
section {
	border: 1px solid var(--theme--border-color, #eee);
	border-radius: 6px;
	padding: 10px 14px;
}
section ul {
	margin: 6px 0 0;
	padding-left: 18px;
}
.tag {
	display: inline-block;
	padding: 2px 8px;
	border-radius: 10px;
	background: var(--theme--primary-subdued, #e8f7f3);
	color: var(--theme--primary, #1abc9c);
	font-size: 11px;
	margin-left: 6px;
}
.actions {
	display: flex;
	gap: 8px;
	margin-top: 8px;
}
</style>
