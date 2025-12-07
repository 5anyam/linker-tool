import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { campId, offerLink, safeLink, redirectDomain, baseDomain, countries } = body;

    if (!campId || !offerLink) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    await redis.set(`camp:${campId}`, JSON.stringify({
      offer_link: offerLink,
      safe_link: safeLink,
      redirect_domain: redirectDomain,
      base_domain: baseDomain,
      countries: countries,
      created_at: new Date().toISOString()
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Database Error' }, { status: 500 });
  }
}
