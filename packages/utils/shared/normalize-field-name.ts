export class InvalidFieldNameError extends Error {
	constructor(reason: string) {
		super(reason);
		this.name = 'InvalidFieldNameError';
	}
}

export function normalizeFieldName(raw: string): string {
	const normalized = raw
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim()
		.replace(/([a-z0-9])([A-Z])/g, '$1_$2')
		.replace(/[^a-zA-Z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.toLowerCase();

	if (!normalized) {
		throw new InvalidFieldNameError('Field name cannot be empty');
	}

	if (/^\d/.test(normalized)) {
		throw new InvalidFieldNameError('Field name cannot start with a number');
	}

	return normalized;
}
