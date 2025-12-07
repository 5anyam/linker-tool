// src/app/api/campaign/route.ts
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Naye fields receive karna
    const { campId, offerLink, safeLink, redirectDomain, baseDomain, countries } = body;

    if (!campId || !offerLink) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Redis me pura naya data save karna
    await redis.set(`camp:${campId}`, JSON.stringify({
      offer_link: offerLink,
      safe_link: safeLink,
      redirect_domain: redirectDomain, // Ye bahut zaruri hai
      base_domain: baseDomain,
      countries: countries,
      created_at: new Date().toISOString()
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Redis Save Error:", error);
    return NextResponse.json({ error: 'Database Error' }, { status: 500 });
  }
}
