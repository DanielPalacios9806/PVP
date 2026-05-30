#!/usr/bin/env node
const apiBaseUrl = (process.env.SMOKE_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(/\/$/, "");
const webBaseUrl = (process.env.SMOKE_WEB_URL ?? process.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/$/, "");
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? 8000);

const checks = [
  { name: "Web landing", url: `${webBaseUrl}/`, ok: [200] },
  { name: "Dashboard protegido o visible", url: `${webBaseUrl}/dashboard`, ok: [200, 302, 307, 308] },
  { name: "Terms", url: `${webBaseUrl}/legal/terms`, ok: [200] },
  { name: "Privacy", url: `${webBaseUrl}/legal/privacy`, ok: [200] },
  { name: "Data deletion", url: `${webBaseUrl}/legal/data-deletion`, ok: [200] },
  { name: "Riot health protegido", url: `${apiBaseUrl}/riot/health`, ok: [200, 401, 403] },
  { name: "RSO status protegido", url: `${apiBaseUrl}/riot/rso/status`, ok: [200, 401, 403] }
];

async function ping({ name, url, ok }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: { "User-Agent": "darkside-smoke-check/0.7.1" }
    });
    const ms = Date.now() - started;
    const passed = ok.includes(response.status);
    console.log(`${passed ? "OK" : "FAIL"} ${name} -> ${response.status} (${ms}ms) ${url}`);
    return passed;
  } catch (error) {
    console.log(`FAIL ${name} -> ${error.name === "AbortError" ? "timeout" : error.message} ${url}`);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

console.log("Darkside.cool smoke check");
console.log("=========================");
console.log(`WEB: ${webBaseUrl}`);
console.log(`API: ${apiBaseUrl}`);
console.log("");

let failed = false;
for (const check of checks) {
  const passed = await ping(check);
  if (!passed) failed = true;
}

if (failed) {
  console.log("\nFAIL Smoke check con pendientes. No marques producción como estable todavía.");
  process.exit(1);
}

console.log("\nOK Smoke check mínimo aprobado.");
