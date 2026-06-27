import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { db, type UserRow, type SessionRow } from './db';

export const SESSION_COOKIE = 'session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7일

// ── 비밀번호 해싱 (scrypt, salt 포함) ───────────────────────────────
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;
  const derived = scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, 'hex');
  return keyBuf.length === derived.length && timingSafeEqual(keyBuf, derived);
}

// ── 사용자 ──────────────────────────────────────────────────────────
export function createUser(email: string, name: string, password: string): UserRow {
  const stmt = db.prepare(
    'INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)'
  );
  const info = stmt.run(email.toLowerCase().trim(), name.trim(), hashPassword(password));
  return getUserById(Number(info.lastInsertRowid))!;
}

export function getUserByEmail(email: string): UserRow | undefined {
  return db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email.toLowerCase().trim()) as UserRow | undefined;
}

export function getUserById(id: number): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
}

export function updateUserName(id: number, name: string): void {
  db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), id);
}

export function updateUserPassword(id: number, password: string): void {
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(password), id);
}

export function deleteUser(id: number): void {
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

export function listUsers(): UserRow[] {
  return db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as UserRow[];
}

// ── 세션 ────────────────────────────────────────────────────────────
export function createSession(userId: number): SessionRow {
  const id = randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(
    id,
    userId,
    expiresAt
  );
  return { id, user_id: userId, expires_at: expiresAt, created_at: '' };
}

export function getSessionUser(sessionId: string | undefined): UserRow | null {
  if (!sessionId) return null;
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as
    | SessionRow
    | undefined;
  if (!session) return null;
  if (session.expires_at < Date.now()) {
    destroySession(sessionId);
    return null;
  }
  return getUserById(session.user_id) ?? null;
}

export function destroySession(sessionId: string): void {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

export const SESSION_MAX_AGE = SESSION_TTL_MS / 1000; // 쿠키 Max-Age (초)
