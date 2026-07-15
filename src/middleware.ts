import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

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

// Referrer modes:
//  'no-referrer' -> destination ko koi Referer nahi (max hide, default).
//  'origin'      -> sirf cloaker domain (https://domain) Referer me jaata hai.
//                   Un networks ke liye jo "koi bhi" referrer maangte hain.
//  'unsafe-url'  -> poora URL Referer me jaata hai (rarely needed).
type RefPolicy = 'no-referrer' | 'origin' | 'unsafe-url';

// Redirect method:
//  '200' -> 200 OK HTML page + client-side redirect (SAFEST, referrer 100% control).
//  '302' -> Seedha HTTP 302 redirect (FAST, referrer Referrer-Policy header se control).
type RedirectMethod = '200' | '302';

// 200 OK HTML page jo client-side redirect karta hai. Referer control refPolicy se.
// Navigation is page se hoti hai, isliye source/original traffic ka Referer kabhi leak nahi hota.
function redirectPage(targetUrl: string, refPolicy: RefPolicy = 'no-referrer') {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="referrer" content="${refPolicy}">
<meta http-equiv="refresh" content="0;url=${htmlEscape(targetUrl)}">
<script>window.location.replace(${JSON.stringify(targetUrl)});</script>
</head>
<body><a href="${htmlEscape(targetUrl)}">Continue</a></body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Referrer-Policy': refPolicy,
      // Cache na ho warna cloaked link stale response de sakta hai
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

// Fast HTTP 302 redirect. Referer Referrer-Policy header se control hota hai
// (no-referrer = blank). Modern browsers isse honor karte hain.
function httpRedirect(targetUrl: string, refPolicy: RefPolicy = 'no-referrer') {
  const res = NextResponse.redirect(new URL(targetUrl), { status: 302 });
  res.headers.set('Referrer-Policy', refPolicy);
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return res;
}

// Campaign ke method ke hisaab se sahi redirect chun le.
function buildRedirect(targetUrl: string, method: RedirectMethod, refPolicy: RefPolicy) {
  return method === '302'
    ? httpRedirect(targetUrl, refPolicy)
    : redirectPage(targetUrl, refPolicy);
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/_next') || url.pathname.includes('favicon')) {
    return NextResponse.next();
  }

  let rawQuery = url.search.substring(1);
  if (!rawQuery) return NextResponse.next();
  if (rawQuery.endsWith('=')) rawQuery = rawQuery.slice(0, -1);
  
  const parts = rawQuery.split('?');
  const campId = parts[0];

  try {
    const rawData = await redis.get(`camp:${campId}`);
    if (!rawData) return NextResponse.next();

    const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    const campaign = data as {
      offer_link: string;
      safe_link?: string;
      redirect_domain?: string;
      referrer_mode?: RefPolicy;
      redirect_method?: RedirectMethod;
    };

    // Per-campaign referrer. Default 'no-referrer'. Jo campaigns empty referrer pe
    // ruk jaate hain unke liye dashboard se 'origin' (ya 'unsafe-url') set kar do.
    const refPolicy: RefPolicy = campaign.referrer_mode || 'no-referrer';

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
        return buildRedirect(middlemanUrl, method, 'no-referrer');
    }

    // Scenario 2: Direct Jump (1 Hop Saved)
    // Agar "Redirect Domain" khali chod doge dashboard mein, toh ye seedha Awin bhej dega.
    // method (302/200) + refPolicy (hide/origin) dono campaign se aate hain.
    return buildRedirect(finalUrl, method, refPolicy);

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
