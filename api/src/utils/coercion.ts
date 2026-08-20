export type CoercionViolation = { id: string | number; value: unknown };

export function validateIntegerCoercion(rows: Record<string, unknown>[], primaryKey: string, field: string): CoercionViolation[] {
	return rows
		.filter((row) => row[field] !== null && row[field] !== undefined && !/^-?\d+$/.test(String(row[field])))
		.map((row) => ({ id: row[primaryKey] as string | number, value: row[field] }));
}
