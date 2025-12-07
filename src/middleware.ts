import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

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
        
        // Use Status 302 (Found) - Faster for Affiliates than 307
        const response = NextResponse.redirect(new URL(middlemanUrl), { status: 302 });
        response.headers.set('Referrer-Policy', 'unsafe-url'); 
        return response;
    }

    // Scenario 2: Direct Jump (1 Hop Saved)
    // Agar "Redirect Domain" khali chod doge dashboard mein, toh ye seedha Awin bhej dega
    // Referrer: linker-tool.vercel.app jayega
    const response = NextResponse.redirect(new URL(finalUrl), { status: 302 });
    return response;

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
