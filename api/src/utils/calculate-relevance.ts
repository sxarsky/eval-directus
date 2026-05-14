/**
 * Relevance scoring for /search results.
 *
 * Score is a unit-less ratio of how much of a field matched the query, used
 * to order results. Higher score = more relevant.
 */

export interface RelevanceInput {
	matchCount: number;
	fieldLength: number;
}

export interface ScoredHit<T> {
	hit: T;
	score: number;
}

export function calculateRelevance({ matchCount, fieldLength }: RelevanceInput): number {
	const score = matchCount / fieldLength;
	return Math.min(score, 1);
}

export function scoreHits<T>(
	hits: T[],
	getInput: (hit: T) => RelevanceInput,
): ScoredHit<T>[] {
	return hits
		.map((hit) => ({ hit, score: calculateRelevance(getInput(hit)) }))
		.sort((a, b) => b.score - a.score);
}
