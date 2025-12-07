// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  
  // 1. Basic Filters (API & Static Files Ignore)
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/_next') || url.pathname.includes('favicon')) {
    return NextResponse.next();
  }

  // 2. URL Cleaning & Parsing
  // Example: ?971?subID?clickID
  let rawQuery = url.search.substring(1);
  if (!rawQuery) return NextResponse.next();
  
  // Fix for trailing '=' or extra chars
  if (rawQuery.endsWith('=')) rawQuery = rawQuery.slice(0, -1);
  const parts = rawQuery.split('?');
  const campId = parts[0];

  console.log(`🔍 Checking Campaign: ${campId}`);

  try {
    // 3. Redis Fetch
    const rawData = await redis.get(`camp:${campId}`);
    
    if (!rawData) {
      console.log(`❌ Campaign ${campId} Not Found`);
      return NextResponse.next(); 
    }

    // Data Parse
    const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    // Type definition for safety
    const campaign = data as { 
      offer_link: string; 
      safe_link?: string;
      redirect_domain?: string; // New field
      countries?: string[];
    };

    // 4. CLOAKING LOGIC (Bot Check)
    // Filhal hum sabko Human maan rahe hain (MVP)
    // Bot check yahan add kar sakte hain (User-Agent check)
    const isBot = false; 

    // Decision: Money Page vs Safe Page
    let finalUrl = campaign.safe_link || 'https://google.com'; // Default Safe
    let isMoneyPage = false;

    if (!isBot) {
        finalUrl = campaign.offer_link;
        isMoneyPage = true;
    }

    // 5. URL Variables Replacement ({sub_id}, {click_id})
    const subId = parts[1] || '';
    const clickId = parts[2] || '';

    // SubID
    if (finalUrl.includes('{sub_id}')) {
        finalUrl = finalUrl.replace('{sub_id}', subId);
    } else if (subId) {
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + `subid=${subId}`;
    }

    // ClickID
    if (finalUrl.includes('{click_id}')) {
        finalUrl = finalUrl.replace('{click_id}', clickId);
    } else if (clickId) {
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + `click_id=${clickId}`;
    }

    // Double-link garbage cleaner
    if (finalUrl.includes('http') && finalUrl.lastIndexOf('http') > 0) {
       finalUrl = finalUrl.substring(0, finalUrl.lastIndexOf('http')); 
    }

    // 6. REDIRECT EXECUTION 🚀
    
    // Scenario A: Money Page + Redirect Domain (e.g. blog.clubmytrip.com)
    if (isMoneyPage && campaign.redirect_domain) {
        console.log(`🔗 Using Redirect Domain: ${campaign.redirect_domain}`);
        
        // Base64 Encode to bypass Firewall (403 Error Fix)
        const base64Link = Buffer.from(finalUrl).toString('base64');
        
        // Construct Middleman URL
        // Format: https://BLOG_DOMAIN/go.php?data=BASE64_STRING
        const middlemanUrl = `https://${campaign.redirect_domain}/go.php?data=${base64Link}`;
        
        return NextResponse.redirect(new URL(middlemanUrl));
    }

    // Scenario B: Safe Page OR Direct Redirect (No Middleman)
    console.log("🚀 Direct Redirect to:", finalUrl);
    return NextResponse.redirect(new URL(finalUrl));

  } catch (error) {
    console.error("🔥 Middleware Error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
