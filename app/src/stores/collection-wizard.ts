import { defineStore } from 'pinia';

export interface FieldDraft {
	field: string;
	type: string;
}

export interface RelationDraft {
	field: string;
	relatedCollection: string;
}

export interface PermissionDraft {
	role: string | null;
	action: 'create' | 'read' | 'update' | 'delete';
	allow: boolean;
}

interface State {
	name: string;
	singleton: boolean;
	fields: FieldDraft[];
	relations: RelationDraft[];
	permissions: PermissionDraft[];
}

const initialState = (): State => ({
	name: '',
	singleton: false,
	fields: [],
	relations: [],
	permissions: [],
});

export const useCollectionWizardStore = defineStore({
	id: 'collectionWizard',
	state: initialState,
	actions: {
		setNameAndSingleton(name: string, singleton: boolean) {
			this.name = name.trim();
			this.singleton = singleton;
		},
		setFields(fields: FieldDraft[]) {
			this.fields = fields;
		},
		setRelations(relations: RelationDraft[]) {
			this.relations = relations;
		},
		setPermissions(permissions: PermissionDraft[]) {
			this.permissions = permissions;
		},
		reset() {
			Object.assign(this, initialState());
		},
	},
});
