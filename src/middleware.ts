import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  
  // 1. Basic Filters
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/_next') || url.pathname.includes('favicon')) {
    return NextResponse.next();
  }

  // 2. Query Parsing
  let rawQuery = url.search.substring(1);
  if (!rawQuery) return NextResponse.next();
  if (rawQuery.endsWith('=')) rawQuery = rawQuery.slice(0, -1);
  
  const parts = rawQuery.split('?');
  const campId = parts[0];

  try {
    // 3. Redis Fetch
    const rawData = await redis.get(`camp:${campId}`);
    if (!rawData) return NextResponse.next();

    const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    const campaign = data as { 
      offer_link: string; 
      safe_link?: string;
      redirect_domain?: string;
    };

    // 4. Bot Check (Optional: Add User-Agent logic here)
    const isBot = false; 

    // Decision
    let finalUrl = campaign.safe_link || 'https://google.com'; 
    let isMoneyPage = false;

    if (!isBot) {
        finalUrl = campaign.offer_link;
        isMoneyPage = true;
    }

    // 5. Replace Variables
    const subId = parts[1] || '';
    const clickId = parts[2] || '';

    if (finalUrl.includes('{sub_id}')) finalUrl = finalUrl.replace('{sub_id}', subId);
    if (finalUrl.includes('{click_id}')) finalUrl = finalUrl.replace('{click_id}', clickId);
    
    // Garbage cleanup
    if (finalUrl.includes('http') && finalUrl.lastIndexOf('http') > 0) {
       finalUrl = finalUrl.substring(0, finalUrl.lastIndexOf('http')); 
    }

    // 6. REDIRECT EXECUTION (Double Jump)
    if (isMoneyPage && campaign.redirect_domain) {
        // Base64 Encode for firewall bypass
        const base64Link = Buffer.from(finalUrl).toString('base64');
        
        // Jump to Middleman (e.g. blog.clubmytrip.com/go.php)
        const middlemanUrl = `https://${campaign.redirect_domain}/go.php?data=${base64Link}`;
        
        return NextResponse.redirect(new URL(middlemanUrl));
    }

    return NextResponse.redirect(new URL(finalUrl));

  } catch (error) {
    console.error("Middleware Error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
