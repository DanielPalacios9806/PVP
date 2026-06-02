#!/usr/bin/env node
import { chromium, devices } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const baseUrl = (process.env.VISUAL_QA_BASE_URL ?? process.env.SMOKE_WEB_URL ?? process.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/$/, "");
const outputRoot = process.env.VISUAL_QA_OUTPUT_DIR ?? "visual-qa-artifacts";
const timeoutMs = Number(process.env.VISUAL_QA_TIMEOUT_MS ?? 15000);
const settleMs = Number(process.env.VISUAL_QA_SETTLE_MS ?? 900);
const tournamentPath = process.env.VISUAL_QA_TOURNAMENT_PATH ?? "/dashboard/tournaments/mock-tournament-1";
const rawRoutes = process.env.VISUAL_QA_ROUTES;

const defaultRoutes = [
  { name: "home", path: "/" },
  { name: "login", path: "/auth/login" },
  { name: "dashboard", path: "/dashboard" },
  { name: "tournaments", path: "/dashboard/tournaments" },
  { name: "tournament-detail", path: tournamentPath },
  { name: "teams", path: "/dashboard/teams" },
  { name: "account", path: "/dashboard/account" },
  { name: "admin", path: "/dashboard/admin" },
  { name: "moderation", path: "/dashboard/moderation" }
];

const routes = rawRoutes
  ? rawRoutes.split(",").map((route) => route.trim()).filter(Boolean).map((route, index) => ({
      name: route.replace(/^\//, "").replaceAll("/", "-") || `route-${index + 1}`,
      path: route.startsWith("/") ? route : `/${route}`
    }))
  : defaultRoutes;

const profiles = [
  {
    name: "desktop",
    viewport: { width: Number(process.env.VISUAL_QA_DESKTOP_WIDTH ?? 1440), height: Number(process.env.VISUAL_QA_DESKTOP_HEIGHT ?? 1000) },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false
  },
  {
    name: "mobile",
    ...devices["iPhone 13"],
    viewport: { width: Number(process.env.VISUAL_QA_MOBILE_WIDTH ?? 390), height: Number(process.env.VISUAL_QA_MOBILE_HEIGHT ?? 844) }
  }
];

function slug(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "capture";
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const runId = process.env.VISUAL_QA_RUN_ID ?? timestamp();
const outputDir = path.join(outputRoot, runId);
mkdirSync(outputDir, { recursive: true });

console.log("Darkside.cool visual QA screenshots");
console.log("====================================");
console.log(`BASE: ${baseUrl}`);
console.log(`OUT : ${outputDir}`);
console.log(`Routes: ${routes.length}`);
console.log("");

const browser = await chromium.launch({ headless: true });
const manifest = {
  baseUrl,
  outputDir,
  runId,
  startedAt: new Date().toISOString(),
  routes,
  captures: []
};

let failed = false;

try {
  for (const profile of profiles) {
    const context = await browser.newContext({
      ...profile,
      colorScheme: "dark",
      reducedMotion: "reduce",
      ignoreHTTPSErrors: true
    });

    for (const route of routes) {
      const page = await context.newPage();
      const url = `${baseUrl}${route.path}`;
      const fileName = `${profile.name}-${slug(route.name)}.png`;
      const filePath = path.join(outputDir, fileName);
      const started = Date.now();

      try {
        const response = await page.goto(url, { waitUntil: "networkidle", timeout: timeoutMs });
        await sleep(settleMs);
        await page.screenshot({ path: filePath, fullPage: true, animations: "disabled" });
        const status = response?.status() ?? 0;
        const ok = status >= 200 && status < 400;
        const ms = Date.now() - started;
        console.log(`${ok ? "OK" : "FAIL"} ${profile.name} ${route.path} -> ${status} (${ms}ms) ${filePath}`);
        manifest.captures.push({ profile: profile.name, route: route.path, url, status, ok, ms, file: fileName });
        if (!ok) failed = true;
      } catch (error) {
        const ms = Date.now() - started;
        console.log(`FAIL ${profile.name} ${route.path} -> ${error.message} (${ms}ms)`);
        manifest.captures.push({ profile: profile.name, route: route.path, url, status: 0, ok: false, ms, error: error.message, file: fileName });
        failed = true;
      } finally {
        await page.close().catch(() => undefined);
      }
    }

    await context.close();
  }
} finally {
  await browser.close();
}

manifest.finishedAt = new Date().toISOString();
writeFileSync(path.join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

const reportLines = [
  "# Visual QA Screenshots",
  "",
  `- Base URL: ${baseUrl}`,
  `- Run ID: ${runId}`,
  `- Output: ${outputDir}`,
  "",
  "| Estado | Perfil | Ruta | HTTP | Archivo |",
  "|---|---|---|---:|---|",
  ...manifest.captures.map((capture) => `| ${capture.ok ? "OK" : "FAIL"} | ${capture.profile} | ${capture.route} | ${capture.status} | ${capture.file} |`),
  ""
];
writeFileSync(path.join(outputDir, "VISUAL_QA_REPORT.md"), reportLines.join("\n"), "utf8");

console.log("");
console.log(`Reporte: ${path.join(outputDir, "VISUAL_QA_REPORT.md")}`);
console.log(`Manifest: ${path.join(outputDir, "manifest.json")}`);

if (failed) {
  console.log("FAIL Visual QA con pendientes. Revisa capturas y estados HTTP.");
  process.exit(1);
}

console.log("OK Visual QA screenshots generadas.");
