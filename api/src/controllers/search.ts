import { InvalidQueryError } from '@directus/errors';
import { Router } from 'express';
import { respond } from '../middleware/respond.js';
import { SearchService } from '../services/search.js';
import { SearchValidationError } from '../utils/validate-search-params.js';
import asyncHandler from '../utils/async-handler.js';

const router = Router();

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new SearchService({
			accountability: req.accountability,
			schema: req.schema,
		});

		try {
			res.locals['payload'] = await service.search(req.query);
		} catch (err) {
			if (err instanceof SearchValidationError) {
				throw new InvalidQueryError({ reason: err.message });
			}
			throw err;
		}

		return next();
	}),
	respond,
);

export default router;
