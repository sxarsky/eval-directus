import { ForbiddenError, InvalidCredentialsError } from '@directus/errors';
import express from 'express';
import { respond } from '../middleware/respond.js';
import asyncHandler from '../utils/async-handler.js';

/**
 * Per-user session management routes mounted under /users/me/sessions.
 *
 * Backed by an in-memory store keyed by user id. A "current" session
 * entry is auto-seeded on first read so the caller can always see at
 * least their own session in the listing.
 */

interface SessionRecord {
	id: string;
	created_at: string;
	user_agent: string;
	ip: string;
}

interface InternalSession extends SessionRecord {
	revoked_at: string | null;
}

const sessionsByUser = new Map<string, InternalSession[]>();
// Map of session id -> user id so DELETE can validate ownership.
const sessionOwners = new Map<string, string>();

function seedCurrentSession(userId: string, userAgent: string, ip: string): InternalSession {
	const id = `current-${userId}`;
	const existing = sessionsByUser.get(userId)?.find((s) => s.id === id);
	if (existing) return existing;

	const record: InternalSession = {
		id,
		created_at: new Date().toISOString(),
		user_agent: userAgent,
		ip,
		revoked_at: null,
	};

	const list = sessionsByUser.get(userId) ?? [];
	list.push(record);
	sessionsByUser.set(userId, list);
	sessionOwners.set(id, userId);
	return record;
}

function toPublicShape(records: InternalSession[], currentSessionId: string) {
	return records.map((record) => ({
		id: record.id,
		created_at: record.created_at,
		user_agent: record.user_agent,
		ip: record.ip,
		current: record.id === currentSessionId,
	}));
}

const router = express.Router();

router.get(
	'/sessions',
	asyncHandler(async (req, res, next) => {
		if (!req.accountability?.user) {
			throw new InvalidCredentialsError();
		}

		const userId = req.accountability.user;
		const userAgent = (req.headers['user-agent'] as string | undefined) ?? 'unknown';
		const ip = req.ip ?? 'unknown';

		// Always make sure the caller's current session is represented so the
		// listing has at least one entry. Production directus would derive
		// this from directus_sessions; this controller fakes it for the
		// scope of the DR05 demo PR.
		const currentSession = seedCurrentSession(userId, userAgent, ip);
		const allRecords = sessionsByUser.get(userId) ?? [];

		// SEEDED DEFECT DR05-E1
		// ----------------------
		// The listing should filter out sessions whose revoked_at timestamp is
		// set, because revoked sessions are not active and should not appear
		// in /users/me/sessions. The current implementation returns ALL
		// records, including revoked ones — so after a successful DELETE the
		// revoked session continues to appear in subsequent listings.
		//
		// Correct implementation:
		//   const activeRecords = allRecords.filter((r) => r.revoked_at === null);
		//   res.locals['payload'] = { data: toPublicShape(activeRecords, currentSession.id) };
		res.locals['payload'] = {
			data: toPublicShape(allRecords, currentSession.id),
		};

		return next();
	}),
	respond,
);

router.delete(
	'/sessions/:id',
	asyncHandler(async (req, res, next) => {
		if (!req.accountability?.user) {
			throw new InvalidCredentialsError();
		}

		const userId = req.accountability.user;
		const sessionId = req.params['id'];

		if (!sessionId) {
			throw new InvalidCredentialsError();
		}

		const owner = sessionOwners.get(sessionId);
		if (!owner) {
			res.status(404);
			res.locals['payload'] = {
				errors: [{ message: 'Session not found' }],
			};
			return next();
		}

		if (owner !== userId) {
			throw new ForbiddenError();
		}

		const list = sessionsByUser.get(userId);
		const record = list?.find((s) => s.id === sessionId);
		if (record) {
			record.revoked_at = new Date().toISOString();
		}

		// SEEDED DEFECT DR05-E2
		// ----------------------
		// Revoking a session should immediately invalidate the cookie/token
		// associated with the session so the very next request using that
		// token returns 401. The correct fix lives in the authenticate
		// middleware (api/src/middleware/authenticate.ts) which should
		// consult a revoked-session list on every request.
		//
		// The current implementation only marks revoked_at locally; the
		// authenticate middleware is NOT modified, so the cookie tied to
		// the revoked session continues to be honored on subsequent
		// requests for a window of time.

		res.status(204);
		return next();
	}),
	respond,
);

export default router;
