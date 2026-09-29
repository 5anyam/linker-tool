import { NextResponse, type NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';
import { SESSION_COOKIE, verifySessionToken } from '@/src/lib/auth';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: NextRequest) {
  if (!(await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { campId, offerLink, safeLink, redirectDomain, baseDomain, countries, redirectMethod } = body;

    if (!campId || !offerLink) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const method = redirectMethod === '302' ? '302' : '200';

    await redis.set(`camp:${campId}`, JSON.stringify({
      offer_link: offerLink,
      safe_link: safeLink,
      redirect_domain: redirectDomain,
      base_domain: baseDomain,
      countries: countries,
      redirect_method: method,
      created_at: new Date().toISOString()
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Database Error' }, { status: 500 });
  }
}
