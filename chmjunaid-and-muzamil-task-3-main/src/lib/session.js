import { randomBytes } from 'crypto';
import { db } from './db.js';
import { sessions, users } from './schema.js';
import { eq, lt } from 'drizzle-orm';

const SESSION_COOKIE = 'sid';
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function generateToken(bytes = 48) {
	return randomBytes(bytes).toString('base64url');
}

export function cookieOptions(dev = false) {
	return {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: !dev,
		maxAge: DEFAULT_MAX_AGE_SECONDS
	};
}

export async function createSession(userId, data = {}, maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS) {
	const sessionToken = generateToken();
	const expires = new Date(Date.now() + maxAgeSeconds * 1000);
	const [row] = await db.insert(sessions).values({ sessionToken, userId, expires, data }).returning();
	return { token: sessionToken, session: row };
}

export async function getSessionByToken(token) {
	if (!token) return null;
	const [row] = await db.select().from(sessions).where(eq(sessions.sessionToken, token));
	if (!row) return null;
	if (new Date(row.expires) <= new Date()) {
		await destroySession(token);
		return null;
	}
	return row;
}

export async function getSessionWithUser(token) {
	const row = await getSessionByToken(token);
	if (!row) return null;
	const [user] = await db.select().from(users).where(eq(users.id, row.userId));
	if (!user) return null;
	return { session: row, user };
}

export async function destroySession(token) {
	await db.delete(sessions).where(eq(sessions.sessionToken, token));
	return true;
}

export async function refreshSession(token, maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS) {
	const row = await getSessionByToken(token);
	if (!row) return null;
	const expires = new Date(Date.now() + maxAgeSeconds * 1000);
	const [updated] = await db.update(sessions).set({ expires }).where(eq(sessions.sessionToken, token)).returning();
	return updated;
}

export async function cleanupExpiredSessions() {
	const now = new Date();
	const deleted = await db.delete(sessions).where(lt(sessions.expires, now)).returning();
	return deleted.length;
}

export async function setSessionCookie(cookies, token, dev) {
	cookies.set(SESSION_COOKIE, token, cookieOptions(dev));
}

export function clearSessionCookie(cookies, dev) {
	cookies.set(SESSION_COOKIE, '', { ...cookieOptions(dev), maxAge: 0 });
}

export function readSessionCookie(cookies) {
	return cookies.get(SESSION_COOKIE) || null;
}
