#!/usr/bin/env node
const apiBaseUrl = (process.env.SMOKE_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(/\/$/, "");
const webBaseUrl = (process.env.SMOKE_WEB_URL ?? process.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/$/, "");
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? 9000);

const checks = [
  { group: "web", name: "Landing pública", url: `${webBaseUrl}/`, ok: [200] },
  { group: "web", name: "Login", url: `${webBaseUrl}/auth/login`, ok: [200] },
  { group: "web", name: "Registro", url: `${webBaseUrl}/auth/register`, ok: [200] },
  { group: "web", name: "Dashboard", url: `${webBaseUrl}/dashboard`, ok: [200, 302, 307, 308] },
  { group: "web", name: "Torneos hub", url: `${webBaseUrl}/dashboard/tournaments`, ok: [200, 302, 307, 308] },
  { group: "web", name: "Teams hub", url: `${webBaseUrl}/dashboard/teams`, ok: [200, 302, 307, 308] },
  { group: "web", name: "Tokens", url: `${webBaseUrl}/dashboard/tokens`, ok: [200, 302, 307, 308] },
  { group: "web", name: "Cuenta", url: `${webBaseUrl}/dashboard/account`, ok: [200, 302, 307, 308] },
  { group: "web", name: "Terms", url: `${webBaseUrl}/legal/terms`, ok: [200] },
  { group: "web", name: "Privacy", url: `${webBaseUrl}/legal/privacy`, ok: [200] },
  { group: "api", name: "API health", url: `${apiBaseUrl}/health`, ok: [200] },
  { group: "api", name: "Riot health protegido", url: `${apiBaseUrl}/riot/health`, ok: [200, 401, 403] },
  { group: "api", name: "Riot status protegido", url: `${apiBaseUrl}/riot/status`, ok: [200, 401, 403] },
  { group: "api", name: "RSO status protegido", url: `${apiBaseUrl}/riot/rso/status`, ok: [200, 401, 403] }
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
      headers: { "User-Agent": "darkside-prebeta-smoke-check/0.8.0" }
    });
    const ms = Date.now() - started;
    const passed = ok.includes(response.status);
    console.log(`${passed ? "OK" : "FAIL"} ${name} -> ${response.status} (${ms}ms)`);
    return passed;
  } catch (error) {
    console.log(`FAIL ${name} -> ${error.name === "AbortError" ? "timeout" : error.message}`);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

console.log("Darkside.cool pre-beta smoke check");
console.log("==================================");
console.log(`WEB: ${webBaseUrl}`);
console.log(`API: ${apiBaseUrl}`);
console.log("");

let failed = false;
for (const group of ["web", "api"]) {
  console.log(`[${group.toUpperCase()}]`);
  for (const check of checks.filter((item) => item.group === group)) {
    const passed = await ping(check);
    if (!passed) failed = true;
  }
  console.log("");
}

if (failed) {
  console.log("FAIL Smoke pre-beta con pendientes. Revisa servicios, rutas o variables antes de deploy estable.");
  process.exit(1);
}

console.log("OK Smoke pre-beta aprobado.");
