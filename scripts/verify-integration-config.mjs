import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const proxy = JSON.parse(readFileSync('proxy.conf.json', 'utf8'));
assert.equal(proxy['/api']?.target, 'http://localhost:3000');

const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
const rewrites = vercel.rewrites ?? [];
const apiRewriteIndex = rewrites.findIndex((rewrite) => rewrite.source === '/api/:path*');
const socialRewriteIndex = rewrites.findIndex((rewrite) => rewrite.source === '/eventos/:slug');
const fallbackIndex = rewrites.findIndex((rewrite) => rewrite.destination === '/index.html');

assert.notEqual(apiRewriteIndex, -1, 'Falta el rewrite público de /api.');
assert.notEqual(socialRewriteIndex, -1, 'Falta el rewrite social de /eventos/:slug.');
assert.notEqual(fallbackIndex, -1, 'Falta el fallback SPA.');
assert.ok(apiRewriteIndex < fallbackIndex, 'El rewrite de /api debe preceder al fallback SPA.');
assert.ok(socialRewriteIndex < fallbackIndex, 'El rewrite social debe preceder al fallback SPA.');
assert.match(vercel.rewrites[apiRewriteIndex].destination, /\/api\/:path\*$/);
assert.match(vercel.rewrites[socialRewriteIndex].destination, /\/api\/social\/events\/:slug$/);

const runtimeConfig = readFileSync('public/runtime-config.js', 'utf8');
assert.match(runtimeConfig, /window\.__APP_CONFIG__\s*=\s*\{/);
assert.match(runtimeConfig, /"apiUrl"\s*:\s*"\/api"/);

console.log('Configuración de integración frontend válida.');
