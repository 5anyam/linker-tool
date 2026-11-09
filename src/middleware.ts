import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';
import { SESSION_COOKIE, verifySessionToken } from '@/src/lib/auth';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Har response (redirect / 404 / pages) pe ye headers lagte hain.
const NO_INDEX = 'noindex, nofollow, noarchive';
const REF_POLICY = 'no-referrer';

// Bare "/" (bina campaign ke) yahan jaata hai.
const ROOT_REDIRECT_URL = process.env.ROOT_REDIRECT_URL || 'https://www.google.com/';

function withHeaders<T extends NextResponse>(res: T): T {
  res.headers.set('Referrer-Policy', REF_POLICY);
  res.headers.set('X-Robots-Tag', NO_INDEX);
  return res;
}

// Server-side HTTP 302. Koi HTML render nahi hota. Redirect response ka
// Referrer-Policy header aage wali request pe apply hota hai (Fetch spec).
function redirect302(targetUrl: string) {
  const res = NextResponse.redirect(new URL(targetUrl), { status: 302 });
  res.headers.set('Cache-Control', 'no-store');
  return withHeaders(res);
}

// Unknown campaign / path -> khaali 404, koi page/branding nahi.
function notFound() {
  return withHeaders(
    new NextResponse(null, { status: 404, headers: { 'Cache-Control': 'no-store' } })
  );
}

// Link ke baad lage extra query params (utm_source=... etc.) destination pe forward karo.
function appendParams(target: string, extra: string) {
  if (!extra) return target;
  const hashIdx = target.indexOf('#');
  const base = hashIdx === -1 ? target : target.slice(0, hashIdx);
  const hash = hashIdx === -1 ? '' : target.slice(hashIdx);
  const sep = base.includes('?') ? (base.endsWith('?') || base.endsWith('&') ? '' : '&') : '?';
  return `${base}${sep}${extra}${hash}`;
}

function isLoggedIn(req: NextRequest) {
  return verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname } = url;

  // Login page: already logged in ho to seedha dashboard.
  if (pathname === '/login') {
    return withHeaders(
      (await isLoggedIn(req))
        ? NextResponse.redirect(new URL('/admin', req.url))
        : NextResponse.next()
    );
  }

  // Dashboard sirf login ke baad.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return withHeaders(
      (await isLoggedIn(req))
        ? NextResponse.next()
        : NextResponse.redirect(new URL('/login', req.url))
    );
  }

  // Campaign links sirf root pe hote hain: /?campId?sub?click[&utm_source=...]
  if (pathname !== '/') return notFound();

  let rawQuery = url.search.substring(1);
  if (!rawQuery) return redirect302(ROOT_REDIRECT_URL);

  // Pehle '&' ke baad wala hissa = extra params (UTM etc.), jo destination pe forward honge.
  let extraParams = '';
  const ampIdx = rawQuery.indexOf('&');
  if (ampIdx !== -1) {
    extraParams = rawQuery.slice(ampIdx + 1);
    rawQuery = rawQuery.slice(0, ampIdx);
  }
  if (rawQuery.endsWith('=')) rawQuery = rawQuery.slice(0, -1);

  // Next query ko normalize karta hai: "?0001?a?b" -> "?0001%3Fa%3Fb=". Isliye decode karo.
  try {
    rawQuery = decodeURIComponent(rawQuery);
  } catch {
    return notFound();
  }

  const parts = rawQuery.split('?');
  const campId = parts[0];
  if (!campId) return notFound();

  try {
    const rawData = await redis.get(`camp:${campId}`);
    if (!rawData) return notFound();

    const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    const campaign = data as {
      offer_link: string;
      safe_link?: string;
      redirect_domain?: string;
    };

    const isBot = false; // Bot logic here

    let finalUrl = campaign.safe_link || 'https://google.com';
    let isMoneyPage = false;

    if (!isBot) {
      finalUrl = campaign.offer_link;
      isMoneyPage = true;
    }

    const subId = parts[1] || '';
    const clickId = parts[2] || '';

    if (finalUrl.includes('{sub_id}')) finalUrl = finalUrl.replace('{sub_id}', subId);
    if (finalUrl.includes('{click_id}')) finalUrl = finalUrl.replace('{click_id}', clickId);

    // Agar offer link ke baad koi doosra URL DIRECTLY jod diya gaya ho to use hatao.
    // BUT: redirect campaigns me nested URL query param hota hai (url=https://shop.com) —
    // use kaatna nahi hai, warna wo campaign toot ke ruk jaata hai.
    const secondHttp = finalUrl.lastIndexOf('http');
    if (secondHttp > 0) {
      const before = finalUrl[secondHttp - 1];
      const nestedInQuery = finalUrl.indexOf('?') !== -1 && finalUrl.indexOf('?') < secondHttp;
      const isParamValue = before === '=' || before === '/' || before === '%';
      if (!nestedInQuery && !isParamValue) {
        finalUrl = finalUrl.substring(0, secondHttp);
      }
    }

    finalUrl = appendParams(finalUrl, extraParams);

    // Scenario 1: "Redirect Domain" bhara ho to go.php hop ke through.
    if (isMoneyPage && campaign.redirect_domain) {
      const base64Link = Buffer.from(finalUrl).toString('base64');
      return redirect302(`https://${campaign.redirect_domain}/go.php?data=${base64Link}`);
    }

    // Scenario 2: Direct jump.
    return redirect302(finalUrl);
  } catch (error) {
    console.error('Error:', error);
    return notFound();
  }
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
