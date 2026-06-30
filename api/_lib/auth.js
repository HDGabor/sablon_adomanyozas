const crypto = require('crypto');

const COOKIE_NAME = 'masa_admin_session';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('Missing ADMIN_SESSION_SECRET environment variable');
  return secret;
}

function sign(value) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('hex');
}

function timingSafeEqualStrings(a, b) {
  const bufA = crypto.createHash('sha256').update(a).digest();
  const bufB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(bufA, bufB);
}

function createSessionToken() {
  const expiresAt = String(Date.now() + SESSION_DURATION_MS);
  const signature = sign(expiresAt);
  return `${expiresAt}.${signature}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [expiresAt, signature] = parts;
  if (!/^\d+$/.test(expiresAt)) return false;

  const expectedSignature = sign(expiresAt);
  if (!timingSafeEqualStrings(signature, expectedSignature)) return false;

  return Date.now() < Number(expiresAt);
}

function parseCookies(req) {
  const header = req.headers.cookie;
  const cookies = {};
  if (!header) return cookies;
  header.split(';').forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    cookies[key] = decodeURIComponent(value);
  });
  return cookies;
}

function isAuthenticated(req) {
  const cookies = parseCookies(req);
  return verifySessionToken(cookies[COOKIE_NAME]);
}

function setSessionCookie(res) {
  const token = createSessionToken();
  const maxAgeSeconds = Math.floor(SESSION_DURATION_MS / 1000);
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}`
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
  );
}

function requireAdmin(req, res) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'unauthorized' });
    return false;
  }
  return true;
}

function checkPassword(submitted) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof submitted !== 'string') return false;
  return timingSafeEqualStrings(submitted, expected);
}

module.exports = {
  COOKIE_NAME,
  isAuthenticated,
  setSessionCookie,
  clearSessionCookie,
  requireAdmin,
  checkPassword
};
