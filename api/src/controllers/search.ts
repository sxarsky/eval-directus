import { Router } from 'express';
import { SearchService } from '../services/search.js';
import { validateSearchParams } from '../utils/validate-search-params.js';
import asyncHandler from '../utils/async-handler.js';
import { InvalidPayloadError } from '@directus/errors';

const router = Router();

router.get(
	'/',
	asyncHandler(async (req, res) => {
		const {
			q,
			collections,
			fields,
			limit = '20',
			offset = '0',
		} = req.query;

		// Validate required parameter
		if (!q || typeof q !== 'string') {
			throw new InvalidPayloadError({ reason: 'Query parameter "q" is required' });
		}

		if (q.length < 2 || q.length > 100) {
			throw new InvalidPayloadError({ reason: 'Query parameter "q" must be between 2 and 100 characters' });
		}

		// Parse collections
		const collectionList = collections
			? (typeof collections === 'string' ? collections.split(',') : [])
			: undefined;

		// Parse fields
		const fieldList = fields
			? (typeof fields === 'string' ? fields.split(',') : [])
			: undefined;

		// Parse limit
		const limitNum = parseInt(limit as string, 10);
		if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
			throw new InvalidPayloadError({ reason: 'Query parameter "limit" must be between 1 and 100' });
		}

		// Parse offset
		const offsetNum = parseInt(offset as string, 10);
		if (isNaN(offsetNum) || offsetNum < 0) {
			throw new InvalidPayloadError({ reason: 'Query parameter "offset" must be non-negative' });
		}

		// Validate parameters against schema
		try {
			await validateSearchParams({
				...(collectionList && { collections: collectionList }),
				...(fieldList && { fields: fieldList }),
				schema: req.schema,
			});
		} catch (error) {
			throw new InvalidPayloadError({ reason: (error as Error).message });
		}

		// Perform search
		const service = new SearchService({
			schema: req.schema,
			accountability: req.accountability,
		});

		const results = await service.search({
			query: q,
			...(collectionList && { collections: collectionList }),
			...(fieldList && { fields: fieldList }),
			limit: limitNum,
			offset: offsetNum,
		});

		res.json(results);
	})
);

export default router;
