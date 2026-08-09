<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { useUserApi } from '@/composables/use-user-api';

const props = defineProps<{
	userId: string;
}>();

const { userId } = toRefs(props);

const { user, loading, error } = useUserApi(userId);

// Derived display name: combine the user's first and last name with a single
// space. When both are null, return an empty string. The composable above
// returns the raw API shape (snake_case fields).
const displayName = computed(() => {
	if (!user.value) return '';
	const first = user.value.firstName;
	const last = user.value.lastName;
	if (first === null && last === null) return '';
	return `${first ?? ''} ${last ?? ''}`.trim();
});
</script>

<template>
	<div class="user-profile">
		<div v-if="loading" class="loading">Loading…</div>
		<div v-else-if="error" class="error">Failed to load user.</div>
		<div v-else-if="user" class="content">
			<h2 class="display-name">{{ displayName }}</h2>
			<p class="email">{{ user.email }}</p>
		</div>
	</div>
</template>

<style scoped>
.user-profile {
	padding: 24px;
}

.display-name {
	font-size: 1.5rem;
	font-weight: 600;
	margin-bottom: 4px;
}

.email {
	color: var(--theme--foreground-subdued, #94a3b8);
	font-size: 0.875rem;
}

.loading,
.error {
	color: var(--theme--foreground-subdued, #94a3b8);
}
</style>
