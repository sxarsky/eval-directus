import { defineStore } from 'pinia';

export type FieldType = 'string' | 'integer' | 'boolean' | 'date';

interface State {
	csvFileName: string | null;
	columns: string[];
	mappings: Record<string, FieldType>;
}

export const useImportWizardStore = defineStore({
	id: 'importWizard',
	state: (): State => ({
		csvFileName: null,
		columns: [],
		mappings: {},
	}),
	actions: {
		setUpload(fileName: string, columns: string[]) {
			this.csvFileName = fileName;
			this.columns = columns;
			this.mappings = {};
		},
		setMapping(column: string, type: FieldType) {
			this.mappings[column] = type;
		},
		reset() {
			this.csvFileName = null;
			this.columns = [];
			this.mappings = {};
		},
	},
});
