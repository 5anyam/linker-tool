import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';
import { SESSION_COOKIE, verifySessionToken } from '@/src/lib/auth';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// HTML entities escape (meta-refresh URL ke double-quote/& ke liye)
function htmlEscape(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Base domain kabhi bhi kisi Referer me nahi jaana chahiye, isliye policy hamesha
// 'no-referrer' hai. Purane campaigns me saved referrer_mode ab ignore hota hai.
const REF_POLICY = 'no-referrer';

// Jo bhi seedha base domain / unknown link khole, use yahan bhej do.
const FALLBACK_URL = 'https://www.google.com/';

// Redirect method:
//  '200' -> 200 OK HTML page + client-side redirect (SAFEST, referrer 100% control).
//  '302' -> Seedha HTTP 302 redirect (FAST, referrer Referrer-Policy header se control).
type RedirectMethod = '200' | '302';

// 200 OK HTML page jo client-side redirect karta hai. Navigation is page se hoti hai
// aur policy no-referrer hai, isliye na source ka na base domain ka Referer leak hota hai.
function redirectPage(targetUrl: string) {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="referrer" content="${REF_POLICY}">
<meta http-equiv="refresh" content="0;url=${htmlEscape(targetUrl)}">
<script>window.location.replace(${JSON.stringify(targetUrl)});</script>
</head>
<body><a href="${htmlEscape(targetUrl)}" rel="noreferrer noopener">Continue</a></body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Referrer-Policy': REF_POLICY,
      'X-Robots-Tag': 'noindex, nofollow',
      // Cache na ho warna cloaked link stale response de sakta hai
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

// Fast HTTP 302 redirect. Redirect response ka Referrer-Policy header aage wali
// request pe apply hota hai (Fetch spec), isliye destination ko Referer blank milta hai.
function httpRedirect(targetUrl: string) {
  const res = NextResponse.redirect(new URL(targetUrl), { status: 302 });
  res.headers.set('Referrer-Policy', REF_POLICY);
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return res;
}

// Campaign ke method ke hisaab se sahi redirect chun le.
function buildRedirect(targetUrl: string, method: RedirectMethod) {
  return method === '302' ? httpRedirect(targetUrl) : redirectPage(targetUrl);
}

function toFallback() {
  return httpRedirect(FALLBACK_URL);
}

function isLoggedIn(req: NextRequest) {
  return verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname } = url;
  
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('favicon')) {
    return NextResponse.next();
  }

  // Login page: already logged in ho to seedha dashboard.
  if (pathname === '/login') {
    return (await isLoggedIn(req))
      ? NextResponse.redirect(new URL('/admin', req.url))
      : NextResponse.next();
  }

  // Dashboard sirf login ke baad.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return (await isLoggedIn(req))
      ? NextResponse.next()
      : NextResponse.redirect(new URL('/login', req.url));
  }

  // Cloaked links sirf root pe hote hain (/?campId?sub?click). Baaki sab -> google.
  if (pathname !== '/') return toFallback();

  let rawQuery = url.search.substring(1);
  if (!rawQuery) return toFallback();
  if (rawQuery.endsWith('=')) rawQuery = rawQuery.slice(0, -1);
  
  const parts = rawQuery.split('?');
  const campId = parts[0];

  try {
    const rawData = await redis.get(`camp:${campId}`);
    if (!rawData) return toFallback();

    const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    const campaign = data as {
      offer_link: string;
      safe_link?: string;
      redirect_domain?: string;
      redirect_method?: RedirectMethod;
    };

    // Per-campaign redirect method. Default '200' (safest). Speed chahiye to '302'.
    const method: RedirectMethod = campaign.redirect_method === '302' ? '302' : '200';

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

    // 🚀 OPTIMIZATION START 🚀
    
    // Scenario 1: Referrer Hiding (Go via PHP)
    // Ye tabhi use hoga jab dashboard mein "Redirect Domain" bhara ho
    if (isMoneyPage && campaign.redirect_domain) {
        const base64Link = Buffer.from(finalUrl).toString('base64');
        const middlemanUrl = `https://${campaign.redirect_domain}/go.php?data=${base64Link}`;

        // go.php khud apna (blog) referrer affiliate ko inject karta hai,
        // isliye is hop pe no-referrer rakhna safe hai.
        return buildRedirect(middlemanUrl, method);
    }

    // Scenario 2: Direct Jump (1 Hop Saved)
    // Agar "Redirect Domain" khali chod doge dashboard mein, toh ye seedha Awin bhej dega.
    return buildRedirect(finalUrl, method);

  } catch (error) {
    console.error("Error:", error);
    return toFallback();
  }
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
