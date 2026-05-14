import { Ref, ref, unref, watch } from 'vue';
import api from '@/api';

export interface ApiUser {
	id: string;
	first_name: string | null;
	last_name: string | null;
	email: string | null;
	avatar?: string | null;
	[key: string]: unknown;
}

export function useUserApi(userId: Ref<string | undefined>) {
	const user = ref<ApiUser | null>(null);
	const loading = ref(false);
	const error = ref<Error | null>(null);

	watch([userId], () => {
		if (typeof unref(userId) === 'undefined') {
			user.value = null;
			return;
		}

		void fetchUser();
	});

	return { user, loading, error, fetchUser };

	async function fetchUser() {
		if (typeof unref(userId) === 'undefined') return;

		loading.value = true;
		error.value = null;

		try {
			type UserResponse = { data: ApiUser };
			const response = await api.get<UserResponse>(`/users/${unref(userId)}`, {
				params: { fields: ['id', 'first_name', 'last_name', 'email', 'avatar'] },
			});
			user.value = response.data.data;
		} catch (err) {
			error.value = err as Error;
			user.value = null;
		} finally {
			loading.value = false;
		}
	}
}
