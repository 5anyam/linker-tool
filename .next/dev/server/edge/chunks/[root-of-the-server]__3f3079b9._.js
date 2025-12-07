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

// src/middleware.ts
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
    // 1. Basic Filters (API & Static Files Ignore)
    if (url.pathname.startsWith('/api') || url.pathname.startsWith('/_next') || url.pathname.includes('favicon')) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    // 2. URL Cleaning & Parsing
    // Example: ?971?subID?clickID
    let rawQuery = url.search.substring(1);
    if (!rawQuery) return __TURBOPACK__imported__module__$5b$project$5d2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
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
            return __TURBOPACK__imported__module__$5b$project$5d2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
        }
        // Data Parse
        const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        // Type definition for safety
        const campaign = data;
        // 4. CLOAKING LOGIC (Bot Check)
        // Filhal hum sabko Human maan rahe hain (MVP)
        // Bot check yahan add kar sakte hain (User-Agent check)
        const isBot = false;
        // Decision: Money Page vs Safe Page
        let finalUrl = campaign.safe_link || 'https://google.com'; // Default Safe
        let isMoneyPage = false;
        if ("TURBOPACK compile-time truthy", 1) {
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
            const base64Link = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$buffer__$5b$external$5d$__$28$node$3a$buffer$2c$__cjs$29$__["Buffer"].from(finalUrl).toString('base64');
            // Construct Middleman URL
            // Format: https://BLOG_DOMAIN/go.php?data=BASE64_STRING
            const middlemanUrl = `https://${campaign.redirect_domain}/go.php?data=${base64Link}`;
            return __TURBOPACK__imported__module__$5b$project$5d2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(middlemanUrl));
        }
        // Scenario B: Safe Page OR Direct Redirect (No Middleman)
        console.log("🚀 Direct Redirect to:", finalUrl);
        return __TURBOPACK__imported__module__$5b$project$5d2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(finalUrl));
    } catch (error) {
        console.error("🔥 Middleware Error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
}
const config = {
    matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)'
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__3f3079b9._.js.map