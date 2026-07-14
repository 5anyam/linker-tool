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

// 200 OK HTML page jo client-side redirect karta hai bina koi Referer bheje.
// Kyunki navigation is page se hoti hai jismein <meta referrer no-referrer> hai,
// destination ko source/cloaker ka Referer bilkul nahi milta.
function noReferrerRedirect(targetUrl: string) {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="referrer" content="no-referrer">
<meta http-equiv="refresh" content="0;url=${htmlEscape(targetUrl)}">
<script>window.location.replace(${JSON.stringify(targetUrl)});</script>
</head>
<body><a href="${htmlEscape(targetUrl)}">Continue</a></body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Referrer-Policy': 'no-referrer',
      // Cache na ho warna cloaked link stale response de sakta hai
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
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
    
    if (finalUrl.includes('http') && finalUrl.lastIndexOf('http') > 0) {
       finalUrl = finalUrl.substring(0, finalUrl.lastIndexOf('http')); 
    }

    // 🚀 OPTIMIZATION START 🚀
    
    // Scenario 1: Referrer Hiding (Go via PHP)
    // Ye tabhi use hoga jab dashboard mein "Redirect Domain" bhara ho
    if (isMoneyPage && campaign.redirect_domain) {
        const base64Link = Buffer.from(finalUrl).toString('base64');
        const middlemanUrl = `https://${campaign.redirect_domain}/go.php?data=${base64Link}`;

        // 200 OK HTML page se redirect - koi Referer aage nahi jaata.
        // Tracking sub_id/click_id URL ke andar hoti hai, isliye wo sahi jaati hai.
        return noReferrerRedirect(middlemanUrl);
    }

    // Scenario 2: Direct Jump (1 Hop Saved)
    // Agar "Redirect Domain" khali chod doge dashboard mein, toh ye seedha Awin bhej dega
    return noReferrerRedirect(finalUrl);

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
