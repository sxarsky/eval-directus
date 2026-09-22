import { defineStore } from 'pinia';

interface State {
	tagName: string;
	tagColor: string;
	selectedCollections: string[];
}

export const useBulkTagWizardStore = defineStore({
	id: 'bulkTagWizard',
	state: (): State => ({
		tagName: '',
		tagColor: '#888888',
		selectedCollections: [],
	}),
	actions: {
		setTagInfo(name: string, color: string) {
			this.tagName = name;
			this.tagColor = color;
		},
		setSelectedCollections(collectionKeys: string[]) {
			this.selectedCollections = collectionKeys;
		},
		reset() {
			this.tagName = '';
			this.tagColor = '#888888';
			this.selectedCollections = [];
		},
	},
});
