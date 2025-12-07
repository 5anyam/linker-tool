// src/middleware.ts (COMPLETE CODE)
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

    const isBot = false; // Add User-Agent logic if needed

    // Decision
    let finalUrl = campaign.safe_link || 'https://google.com'; 
    let isMoneyPage = false;

    if (!isBot) {
        finalUrl = campaign.offer_link;
        isMoneyPage = true;
    }

    // 4. Replace Variables
    const subId = parts[1] || '';
    const clickId = parts[2] || '';

    if (finalUrl.includes('{sub_id}')) finalUrl = finalUrl.replace('{sub_id}', subId);
    if (finalUrl.includes('{click_id}')) finalUrl = finalUrl.replace('{click_id}', clickId);
    
    // Garbage cleanup
    if (finalUrl.includes('http') && finalUrl.lastIndexOf('http') > 0) {
       finalUrl = finalUrl.substring(0, finalUrl.lastIndexOf('http')); 
    }

    // 5. REDIRECT EXECUTION 🚀
    if (isMoneyPage && campaign.redirect_domain) {
        // Base64 Encode
        const base64Link = Buffer.from(finalUrl).toString('base64');
        
        // Middleman URL
        const middlemanUrl = `https://${campaign.redirect_domain}/go.php?data=${base64Link}`;
        
        // Force Referrer Header (CRITICAL FIX) 🛠️
        const response = NextResponse.redirect(new URL(middlemanUrl));
        response.headers.set('Referrer-Policy', 'unsafe-url'); 
        
        return response;
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
