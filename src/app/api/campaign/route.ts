import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { campId, offerLink, safeLink, redirectDomain, baseDomain, countries, referrerMode, redirectMethod } = body;

    if (!campId || !offerLink) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    // Sirf allowed values save karo, warna default hide.
    const allowedModes = ['no-referrer', 'origin', 'unsafe-url'];
    const refMode = allowedModes.includes(referrerMode) ? referrerMode : 'no-referrer';
    const method = redirectMethod === '302' ? '302' : '200';

    await redis.set(`camp:${campId}`, JSON.stringify({
      offer_link: offerLink,
      safe_link: safeLink,
      redirect_domain: redirectDomain,
      base_domain: baseDomain,
      countries: countries,
      referrer_mode: refMode,
      redirect_method: method,
      created_at: new Date().toISOString()
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Database Error' }, { status: 500 });
  }
}
