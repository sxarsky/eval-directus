import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface PendingInvite {
	id: string;
	email: string;
	role: string;
}

export const useUserInvitesStore = defineStore('userInvites', () => {
	const pending = ref<PendingInvite[]>([]);

	function add(emails: string[], role: string): string[] {
		const ids: string[] = [];
		const baseTimestamp = performance.now();

		for (let i = 0; i < emails.length; i++) {
			const email = emails[i];
			if (!email) continue;
			const id = `invite_${baseTimestamp}_${i}_${email}`;
			pending.value.push({ id, email, role });
			ids.push(id);
		}

		return ids;
	}

	function reconcile(ids: string[]) {
		pending.value = pending.value.filter((p) => !ids.includes(p.id));
	}

	function revert(ids: string[]) {
		pending.value = pending.value.filter((p) => !ids.includes(p.id));
	}

	return { pending, add, reconcile, revert };
});