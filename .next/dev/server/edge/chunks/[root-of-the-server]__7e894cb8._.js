(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__7e894cb8._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/Documents/link-cloaker/src/lib/auth.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Simple single-user login. Edge (middleware) aur Node (API routes) dono me chalta hai
// kyunki sirf Web Crypto use ho raha hai.
__turbopack_context__.s([
    "ADMIN_PASS",
    ()=>ADMIN_PASS,
    "ADMIN_USER",
    ()=>ADMIN_USER,
    "SESSION_COOKIE",
    ()=>SESSION_COOKIE,
    "SESSION_MAX_AGE",
    ()=>SESSION_MAX_AGE,
    "checkCredentials",
    ()=>checkCredentials,
    "createSessionToken",
    ()=>createSessionToken,
    "verifySessionToken",
    ()=>verifySessionToken
]);
const ADMIN_USER = process.env.ADMIN_USER || 'Adshouz';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Adshouz@123';
const SESSION_COOKIE = 'ads_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 din
// Cookie sign karne ka secret. AUTH_SECRET set na ho to Upstash token (jo already secret hai) use hota hai.
const SECRET = process.env.AUTH_SECRET || process.env.UPSTASH_REDIS_REST_TOKEN || 'change-me';
const enc = new TextEncoder();
async function hmac(data) {
    const key = await crypto.subtle.importKey('raw', enc.encode(SECRET), {
        name: 'HMAC',
        hash: 'SHA-256'
    }, false, [
        'sign'
    ]);
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
    return Array.from(new Uint8Array(sig), (b)=>b.toString(16).padStart(2, '0')).join('');
}
function safeEqual(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for(let i = 0; i < a.length; i++)diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}
function checkCredentials(user, pass) {
    return typeof user === 'string' && typeof pass === 'string' && safeEqual(user, ADMIN_USER) && safeEqual(pass, ADMIN_PASS);
}
async function createSessionToken() {
    const exp = String(Date.now() + SESSION_MAX_AGE * 1000);
    return `${exp}.${await hmac(exp)}`;
}
async function verifySessionToken(token) {
    if (!token) return false;
    const [exp, sig] = token.split('.');
    if (!exp || !sig || Number(exp) < Date.now()) return false;
    return safeEqual(sig, await hmac(exp));
}
}),
"[project]/Documents/link-cloaker/src/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$buffer__$5b$external$5d$__$28$node$3a$buffer$2c$__cjs$29$__ = /*#__PURE__*/ __turbopack_context__.i("[externals]/node:buffer [external] (node:buffer, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Documents/link-cloaker/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/link-cloaker/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$link$2d$cloaker$2f$node_modules$2f40$upstash$2f$redis$2f$nodejs$2e$mjs__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Documents/link-cloaker/node_modules/@upstash/redis/nodejs.mjs [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$link$2d$cloaker$2f$src$2f$lib$2f$auth$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Documents/link-cloaker/src/lib/auth.ts [middleware-edge] (ecmascript)");
;
;
;
const redis = new __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$link$2d$cloaker$2f$node_modules$2f40$upstash$2f$redis$2f$nodejs$2e$mjs__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Redis"]({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
});
// Har response (redirect / 404 / pages) pe ye headers lagte hain.
const NO_INDEX = 'noindex, nofollow, noarchive';
const REF_POLICY = 'no-referrer';
// Bare "/" (bina campaign ke) yahan jaata hai.
const ROOT_REDIRECT_URL = process.env.ROOT_REDIRECT_URL || 'https://www.google.com/';
function withHeaders(res) {
    res.headers.set('Referrer-Policy', REF_POLICY);
    res.headers.set('X-Robots-Tag', NO_INDEX);
    return res;
}
// Server-side HTTP 302. Koi HTML render nahi hota. Redirect response ka
// Referrer-Policy header aage wali request pe apply hota hai (Fetch spec).
function redirect302(targetUrl) {
    const res = __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(targetUrl), {
        status: 302
    });
    res.headers.set('Cache-Control', 'no-store');
    return withHeaders(res);
}
// Unknown campaign / path -> khaali 404, koi page/branding nahi.
function notFound() {
    return withHeaders(new __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"](null, {
        status: 404,
        headers: {
            'Cache-Control': 'no-store'
        }
    }));
}
// Link ke baad lage extra query params (utm_source=... etc.) destination pe forward karo.
function appendParams(target, extra) {
    if (!extra) return target;
    const hashIdx = target.indexOf('#');
    const base = hashIdx === -1 ? target : target.slice(0, hashIdx);
    const hash = hashIdx === -1 ? '' : target.slice(hashIdx);
    const sep = base.includes('?') ? base.endsWith('?') || base.endsWith('&') ? '' : '&' : '?';
    return `${base}${sep}${extra}${hash}`;
}
function isLoggedIn(req) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$link$2d$cloaker$2f$src$2f$lib$2f$auth$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["verifySessionToken"])(req.cookies.get(__TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$link$2d$cloaker$2f$src$2f$lib$2f$auth$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["SESSION_COOKIE"])?.value);
}
async function middleware(req) {
    const url = req.nextUrl;
    const { pathname } = url;
    // Login page: already logged in ho to seedha dashboard.
    if (pathname === '/login') {
        return withHeaders(await isLoggedIn(req) ? __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL('/admin', req.url)) : __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next());
    }
    // Dashboard sirf login ke baad.
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
        return withHeaders(await isLoggedIn(req) ? __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next() : __TURBOPACK__imported__module__$5b$project$5d2f$Documents$2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL('/login', req.url)));
    }
    // Campaign links sirf root pe hote hain: /?campId?sub?click[&utm_source=...]
    if (pathname !== '/') return notFound();
    let rawQuery = url.search.substring(1);
    if (!rawQuery) return redirect302(ROOT_REDIRECT_URL);
    // Pehle '&' ke baad wala hissa = extra params (UTM etc.), jo destination pe forward honge.
    let extraParams = '';
    const ampIdx = rawQuery.indexOf('&');
    if (ampIdx !== -1) {
        extraParams = rawQuery.slice(ampIdx + 1);
        rawQuery = rawQuery.slice(0, ampIdx);
    }
    if (rawQuery.endsWith('=')) rawQuery = rawQuery.slice(0, -1);
    // Next query ko normalize karta hai: "?0001?a?b" -> "?0001%3Fa%3Fb=". Isliye decode karo.
    try {
        rawQuery = decodeURIComponent(rawQuery);
    } catch  {
        return notFound();
    }
    const parts = rawQuery.split('?');
    const campId = parts[0];
    if (!campId) return notFound();
    try {
        const rawData = await redis.get(`camp:${campId}`);
        if (!rawData) return notFound();
        const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        const campaign = data;
        const isBot = false; // Bot logic here
        let finalUrl = campaign.safe_link || 'https://google.com';
        let isMoneyPage = false;
        if ("TURBOPACK compile-time truthy", 1) {
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
        finalUrl = appendParams(finalUrl, extraParams);
        // Scenario 1: "Redirect Domain" bhara ho to go.php hop ke through.
        if (isMoneyPage && campaign.redirect_domain) {
            const base64Link = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$buffer__$5b$external$5d$__$28$node$3a$buffer$2c$__cjs$29$__["Buffer"].from(finalUrl).toString('base64');
            return redirect302(`https://${campaign.redirect_domain}/go.php?data=${base64Link}`);
        }
        // Scenario 2: Direct jump.
        return redirect302(finalUrl);
    } catch (error) {
        console.error('Error:', error);
        return notFound();
    }
}
const config = {
    matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)'
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__7e894cb8._.js.map