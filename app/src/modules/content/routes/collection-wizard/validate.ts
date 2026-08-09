/**
 * Step validators for the new-collection wizard.
 *
 * Each function returns null on success or a human-readable error message on
 * failure. The wizard shell consumes these via the `proceed` handler of each
 * step component before advancing `currentStep`.
 */

const RESERVED_COLLECTION_NAMES = new Set([
	'directus_activity',
	'directus_collections',
	'directus_fields',
	'directus_files',
	'directus_folders',
	'directus_permissions',
	'directus_presets',
	'directus_relations',
	'directus_revisions',
	'directus_roles',
	'directus_sessions',
	'directus_settings',
	'directus_users',
	'directus_webhooks',
]);

const NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

export interface StepNameInput {
	name: string;
}

export function validateStepName(input: StepNameInput, existingNames: Set<string>): string | null {
	const trimmed = input.name.trim();
	if (trimmed.length === 0) {
		return 'Collection name is required.';
	}

	if (!NAME_PATTERN.test(trimmed)) {
		return 'Collection name must start with a lowercase letter and contain only lowercase letters, digits, and underscores.';
	}

	if (RESERVED_COLLECTION_NAMES.has(trimmed)) {
		return `The name "${trimmed}" is reserved for a system collection.`;
	}

	if (existingNames.has(trimmed)) {
		return `A collection named "${trimmed}" already exists.`;
	}

	return null;
}

export interface StepFieldsInput {
	fields: { field: string; type: string }[];
}

export function validateStepFields(input: StepFieldsInput): string | null {
	if (input.fields.length === 0) {
		return 'Add at least one field before continuing.';
	}

	const seen = new Set<string>();
	for (const f of input.fields) {
		const name = f.field.trim();
		if (name.length === 0) return 'Field names cannot be empty.';
		if (!NAME_PATTERN.test(name)) {
			return `Field name "${name}" must be lowercase alphanumeric (underscores allowed).`;
		}
		if (seen.has(name)) {
			return `Duplicate field name "${name}".`;
		}
		seen.add(name);
		if (f.type.trim().length === 0) {
			return `Field "${name}" needs a type.`;
		}
	}

	return null;
}
