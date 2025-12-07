(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__3f3079b9._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/link-cloaker/src/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/middleware.ts (COMPLETE CODE)
__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$buffer__$5b$external$5d$__$28$node$3a$buffer$2c$__cjs$29$__ = /*#__PURE__*/ __turbopack_context__.i("[externals]/node:buffer [external] (node:buffer, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/link-cloaker/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/link-cloaker/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$link$2d$cloaker$2f$node_modules$2f40$upstash$2f$redis$2f$nodejs$2e$mjs__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/link-cloaker/node_modules/@upstash/redis/nodejs.mjs [middleware-edge] (ecmascript) <locals>");
;
;
const redis = new __TURBOPACK__imported__module__$5b$project$5d2f$link$2d$cloaker$2f$node_modules$2f40$upstash$2f$redis$2f$nodejs$2e$mjs__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Redis"]({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
});
async function middleware(req) {
    const url = req.nextUrl;
    // 1. Basic Filters
    if (url.pathname.startsWith('/api') || url.pathname.startsWith('/_next') || url.pathname.includes('favicon')) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    // 2. Query Parsing
    let rawQuery = url.search.substring(1);
    if (!rawQuery) return __TURBOPACK__imported__module__$5b$project$5d2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    if (rawQuery.endsWith('=')) rawQuery = rawQuery.slice(0, -1);
    const parts = rawQuery.split('?');
    const campId = parts[0];
    try {
        // 3. Redis Fetch
        const rawData = await redis.get(`camp:${campId}`);
        if (!rawData) return __TURBOPACK__imported__module__$5b$project$5d2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
        const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        const campaign = data;
        const isBot = false; // Add User-Agent logic if needed
        // Decision
        let finalUrl = campaign.safe_link || 'https://google.com';
        let isMoneyPage = false;
        if ("TURBOPACK compile-time truthy", 1) {
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
            const base64Link = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$buffer__$5b$external$5d$__$28$node$3a$buffer$2c$__cjs$29$__["Buffer"].from(finalUrl).toString('base64');
            // Middleman URL
            const middlemanUrl = `https://${campaign.redirect_domain}/go.php?data=${base64Link}`;
            // Force Referrer Header (CRITICAL FIX) 🛠️
            const response = __TURBOPACK__imported__module__$5b$project$5d2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(middlemanUrl));
            response.headers.set('Referrer-Policy', 'unsafe-url');
            return response;
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(finalUrl));
    } catch (error) {
        console.error("Middleware Error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
}
const config = {
    matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)'
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__3f3079b9._.js.map