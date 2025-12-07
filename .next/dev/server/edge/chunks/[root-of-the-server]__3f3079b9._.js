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
    if (url.pathname.startsWith('/api') || url.pathname.startsWith('/_next') || url.pathname.includes('favicon')) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    let rawQuery = url.search.substring(1);
    if (!rawQuery) return __TURBOPACK__imported__module__$5b$project$5d2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    if (rawQuery.endsWith('=')) rawQuery = rawQuery.slice(0, -1);
    const parts = rawQuery.split('?');
    const campId = parts[0];
    try {
        const rawData = await redis.get(`camp:${campId}`);
        if (!rawData) return __TURBOPACK__imported__module__$5b$project$5d2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
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
        if (finalUrl.includes('http') && finalUrl.lastIndexOf('http') > 0) {
            finalUrl = finalUrl.substring(0, finalUrl.lastIndexOf('http'));
        }
        // 🚀 OPTIMIZATION START 🚀
        // Scenario 1: Referrer Hiding (Go via PHP)
        // Ye tabhi use hoga jab dashboard mein "Redirect Domain" bhara ho
        if (isMoneyPage && campaign.redirect_domain) {
            const base64Link = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$buffer__$5b$external$5d$__$28$node$3a$buffer$2c$__cjs$29$__["Buffer"].from(finalUrl).toString('base64');
            const middlemanUrl = `https://${campaign.redirect_domain}/go.php?data=${base64Link}`;
            // Use Status 302 (Found) - Faster for Affiliates than 307
            const response = __TURBOPACK__imported__module__$5b$project$5d2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(middlemanUrl), {
                status: 302
            });
            response.headers.set('Referrer-Policy', 'unsafe-url');
            return response;
        }
        // Scenario 2: Direct Jump (1 Hop Saved)
        // Agar "Redirect Domain" khali chod doge dashboard mein, toh ye seedha Awin bhej dega
        // Referrer: linker-tool.vercel.app jayega
        const response = __TURBOPACK__imported__module__$5b$project$5d2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL(finalUrl), {
            status: 302
        });
        return response;
    } catch (error) {
        console.error("Error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$link$2d$cloaker$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
}
const config = {
    matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)'
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__3f3079b9._.js.map