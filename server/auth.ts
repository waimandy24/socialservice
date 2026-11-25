import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { db, logAudit } from './db.ts';

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export interface AdminRequest extends Request {
  adminUser?: { username: string };
}

interface AdminAccountRow {
  id: number;
  username: string;
  password_hash: string;
  password_salt: string;
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function isEnvPasswordConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim().length > 0);
}

export function getAdminAuthStatus(): { needsSetup: boolean; envControlled: boolean } {
  const envControlled = isEnvPasswordConfigured();
  if (envControlled) {
    return { needsSetup: false, envControlled: true };
  }
  const existing = db.prepare('SELECT id FROM admin_accounts LIMIT 1').get();
  return { needsSetup: !existing, envControlled: false };
}

export function createInitialAdmin(username: string, password: string): { ok: boolean; error?: string } {
  if (isEnvPasswordConfigured()) {
    return { ok: false, error: '管理員密碼已由伺服器環境變數接管，無須首次設定。' };
  }
  const cleanUser = username.trim();
  if (cleanUser.length < 3 || cleanUser.length > 40) {
    return { ok: false, error: '管理員帳號長度須介乎 3 至 40 個字元。' };
  }
  if (password.length < 8) {
    return { ok: false, error: '管理員密碼最少需要 8 個字元。' };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);

  const tx = db.transaction(() => {
    const existing = db.prepare('SELECT COUNT(*) as c FROM admin_accounts').get() as { c: number };
    if (existing.c > 0) {
      return false;
    }
    db.prepare(
      'INSERT INTO admin_accounts (username, password_hash, password_salt) VALUES (?, ?, ?)'
    ).run(cleanUser, hash, salt);
    return true;
  });

  const created = tx();
  if (!created) {
    return { ok: false, error: '管理員帳號已經完成設定，請直接登入。' };
  }
  logAudit('ADMIN_SETUP', 'admin_account', null, `完成首次管理員帳號設定（${cleanUser}）`, cleanUser);
  return { ok: true };
}

export function verifyAdminCredentials(
  username: string,
  password: string
): { valid: boolean; username: string; error?: string } {
  const cleanUser = (username || 'admin').trim();

  if (isEnvPasswordConfigured()) {
    const expected = process.env.ADMIN_PASSWORD!.trim();
    if (safeEqual(password, expected)) {
      return { valid: true, username: cleanUser || 'admin' };
    }
    return { valid: false, username: cleanUser, error: '管理員密碼不正確。' };
  }

  const row = db
    .prepare('SELECT id, username, password_hash, password_salt FROM admin_accounts WHERE username = ?')
    .get(cleanUser) as AdminAccountRow | undefined;

  if (!row) {
    // Perform dummy scrypt to equalize timing
    hashPassword(password, 'timing-guard-salt');
    return { valid: false, username: cleanUser, error: '帳號或密碼不正確。' };
  }

  const computed = hashPassword(password, row.password_salt);
  if (!safeEqual(computed, row.password_hash)) {
    return { valid: false, username: cleanUser, error: '帳號或密碼不正確。' };
  }
  return { valid: true, username: row.username };
}

export function signAdminToken(username: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: username,
      exp: Date.now() + TOKEN_TTL_MS,
      nonce: crypto.randomBytes(8).toString('hex'),
    })
  ).toString('base64url');

  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token: string): { username: string } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  if (!safeEqual(sig, expectedSig)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub?: string;
      exp?: number;
    };
    if (!decoded.sub || !decoded.exp || Date.now() > decoded.exp) {
      return null;
    }
    return { username: decoded.sub };
  } catch {
    return null;
  }
}

export function requireAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: '需要管理員登入驗證。' });
    return;
  }
  const token = header.slice('Bearer '.length).trim();
  const verified = verifyAdminToken(token);
  if (!verified) {
    res.status(401).json({ error: '登入工作階段無效或已過期，請重新登入。' });
    return;
  }
  req.adminUser = verified;
  next();
}
