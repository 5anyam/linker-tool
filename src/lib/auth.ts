// Simple single-user login. Edge (middleware) aur Node (API routes) dono me chalta hai
// kyunki sirf Web Crypto use ho raha hai.

export const ADMIN_USER = process.env.ADMIN_USER || 'Adshouz';
export const ADMIN_PASS = process.env.ADMIN_PASS || 'Adshouz@123';

export const SESSION_COOKIE = 'ads_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 din

// Cookie sign karne ka secret. AUTH_SECRET set na ho to Upstash token (jo already secret hai) use hota hai.
const SECRET = process.env.AUTH_SECRET || process.env.UPSTASH_REDIS_REST_TOKEN || 'change-me';

const enc = new TextEncoder();

async function hmac(data: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function checkCredentials(user: unknown, pass: unknown) {
  return (
    typeof user === 'string' &&
    typeof pass === 'string' &&
    safeEqual(user, ADMIN_USER) &&
    safeEqual(pass, ADMIN_PASS)
  );
}

// Token format: "<expiry_ms>.<hmac>"
export async function createSessionToken() {
  const exp = String(Date.now() + SESSION_MAX_AGE * 1000);
  return `${exp}.${await hmac(exp)}`;
}

export async function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, await hmac(exp));
}
