#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
let failed = false;
let warned = false;

function readIfExists(relativePath) {
  const full = path.join(root, relativePath);
  return existsSync(full) ? readFileSync(full, "utf8") : "";
}

function parseEnvFile(relativePath) {
  const env = {};
  const content = readIfExists(relativePath);
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    const value = rest.join("=").trim().replace(/^['\"]|['\"]$/g, "");
    env[key.trim()] = value;
  }
  return env;
}

const localEnv = {
  ...parseEnvFile(".env"),
  ...parseEnvFile(".env.local"),
  ...process.env
};

function ok(label, condition, hint = "") {
  console.log(`${condition ? "OK" : "FAIL"} ${label}${!condition && hint ? ` -> ${hint}` : ""}`);
  if (!condition) failed = true;
}

function warn(label, condition, hint = "") {
  if (condition) {
    console.log(`OK ${label}`);
    return;
  }
  console.log(`WARN ${label}${hint ? ` -> ${hint}` : ""}`);
  warned = true;
}

function maskedPresence(value) {
  return Boolean(typeof value === "string" && value.trim().length > 0);
}

function isIgnoredPath(relativePath) {
  return (
    relativePath === ".git" ||
    relativePath.startsWith(".git/") ||
    relativePath === "node_modules" ||
    relativePath.includes("/node_modules/") ||
    relativePath.includes("/.next/") ||
    relativePath.includes("/dist/") ||
    relativePath.includes("/build/") ||
    relativePath.includes("/coverage/") ||
    relativePath.includes("/_patches/") ||
    relativePath.endsWith(".zip") ||
    relativePath.endsWith(".7z") ||
    relativePath.endsWith(".rar") ||
    relativePath.endsWith(".png") ||
    relativePath.endsWith(".jpg") ||
    relativePath.endsWith(".jpeg") ||
    relativePath.endsWith(".webp") ||
    relativePath.endsWith(".svg")
  );
}

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const rel = path.relative(root, full).replaceAll(path.sep, "/");
    if (isIgnoredPath(rel)) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (stat.size <= 900_000) files.push(rel);
  }
  return files;
}

function trackedFiles() {
  try {
    return execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((relativePath) => !isIgnoredPath(relativePath));
  } catch {
    return walk(root);
  }
}

function scanVersionedSecrets() {
  const findings = [];
  for (const relativePath of trackedFiles()) {
    let content = "";
    try {
      content = readFileSync(path.join(root, relativePath), "utf8");
    } catch {
      continue;
    }

    if (/RGAPI-[A-Za-z0-9_-]{10,}/.test(content)) {
      findings.push(`${relativePath}: contiene un patrÃ³n RGAPI real`);
    }

    if (/^\s*NEXT_PUBLIC_RIOT_API_KEY\s*=\s*.+/gim.test(content)) {
      findings.push(`${relativePath}: expone NEXT_PUBLIC_RIOT_API_KEY`);
    }
  }
  return findings;
}

const mode = localEnv.RIOT_API_MODE || localEnv.RIOT_MODE || "mock";
const apiKeyConfigured = maskedPresence(localEnv.RIOT_API_KEY);
const publicRiotKeyConfigured = maskedPresence(localEnv.NEXT_PUBLIC_RIOT_API_KEY);
const renderYaml = readIfExists("render.yaml");
const apiPackage = readIfExists("apps/api/package.json");
const webPackage = readIfExists("apps/web/package.json");
const envConfig = readIfExists("apps/api/src/config/env.ts");
const riotRoutes = readIfExists("apps/api/src/modules/riot/riot.routes.ts");
const riotClient = readIfExists("apps/api/src/modules/riot/riot.client.ts");
const docs = [
  "docs/RIOT_API_INTEGRATION.md",
  "docs/RIOT_DEVELOPER_APPLICATION.md",
  "docs/RIOT_PRODUCTION_APPLICATION.md",
  "docs/RIOT_KEY_ROTATION_AND_RENDER_ENV.md"
].map(readIfExists).join("\n");

console.log("Darkside.cool Riot readiness check");
console.log("===================================");
console.log(`Mode: ${mode}`);
console.log(`RIOT_API_KEY: ${apiKeyConfigured ? "configured" : "not configured"}`);
console.log("");

ok("RIOT_API_MODE tiene valor vÃ¡lido", ["mock", "development", "production"].includes(mode), "usa mock, development o production");
if (mode === "mock") {
  warn("RIOT_API_KEY disponible para pruebas reales", apiKeyConfigured, "en mock es opcional, pero para pruebas de hoy usa RIOT_API_MODE=development");
} else {
  ok("RIOT_API_KEY configurada para modo no mock", apiKeyConfigured, "configÃºrala solo en backend/local env/Render API");
}
ok("NEXT_PUBLIC_RIOT_API_KEY no estÃ¡ configurada", !publicRiotKeyConfigured, "la key de Riot jamÃ¡s debe ir al frontend");
ok("Config backend reconoce RIOT_API_KEY", envConfig.includes("RIOT_API_KEY"));
ok("Config backend reconoce RIOT_API_MODE", envConfig.includes("RIOT_API_MODE"));
ok("Riot client centralizado existe", riotClient.includes("getRiotRuntimeConfig") && riotClient.includes("RIOT_API_KEY"));
ok("Rutas Riot protegidas por backend", riotRoutes.includes("requireAuth") && riotRoutes.includes("/health") && riotRoutes.includes("/status"));
ok("API package no depende de NEXT_PUBLIC Riot", !apiPackage.includes("NEXT_PUBLIC_RIOT"));
ok("Web package no declara Riot key pÃºblica", !webPackage.includes("NEXT_PUBLIC_RIOT_API_KEY"));

if (renderYaml) {
  const renderServices = renderYaml
    .split(/\n(?=\s*-\s*type:\s*web\s*\n)/g)
    .map((block) => block.trim())
    .filter(Boolean);

  const apiService =
    renderServices.find((block) =>
      /arena-os-api|api-staging|apps\/api|--workspace\s+apps\/api|name:\s*.*api/i.test(block)
    ) ?? "";

  const webService =
    renderServices.find((block) =>
      /arena-os-web|web-staging|apps\/web|name:\s*.*web/i.test(block) &&
      !/arena-os-api|api-staging|apps\/api|--workspace\s+apps\/api/i.test(block)
    ) ?? "";

  warn("Render Web service identificado", Boolean(webService), "si usas Dashboard manual, valida variables en docs/PRE_BETA_DEPLOY_CHECKLIST.md");
  ok("Render API declara RIOT_API_KEY como sync:false", /^\s*-\s*key:\s*RIOT_API_KEY\s*$/m.test(apiService) && /RIOT_API_KEY[\s\S]{0,120}sync:\s*false/m.test(apiService));
  ok("Render Web no declara RIOT_API_KEY privada", !/^\s*-\s*key:\s*RIOT_API_KEY\s*$/m.test(webService));
  ok("Render Web no declara NEXT_PUBLIC_RIOT_API_KEY", !/NEXT_PUBLIC_RIOT_API_KEY/m.test(webService));
  ok("Render API declara RIOT_API_MODE", /^\s*-\s*key:\s*RIOT_API_MODE\s*$/m.test(apiService));
  ok("Render mantiene RIOT_TOURNAMENT_API_ENABLED declarado", /^\s*-\s*key:\s*RIOT_TOURNAMENT_API_ENABLED\s*$/m.test(apiService));
} else {
  warn("render.yaml disponible para auditoría", false, "si usas Render Dashboard manual, valida variables en docs/PRE_BETA_DEPLOY_CHECKLIST.md");
}
ok("DocumentaciÃ³n de rotaciÃ³n Riot existe", docs.includes("RIOT_API_KEY") && docs.includes("Render"));
ok("DocumentaciÃ³n advierte no usar NEXT_PUBLIC_RIOT_API_KEY", docs.includes("NEXT_PUBLIC_RIOT_API_KEY"));

const findings = scanVersionedSecrets();
ok("No hay Riot API keys versionadas", findings.length === 0, findings.slice(0, 8).join(" | "));

console.log("\nResumen:");
if (failed) {
  console.log("FAIL Riot readiness con pendientes. Corrige antes de deploy o revisiÃ³n Riot.");
  process.exit(1);
}

console.log(warned ? "OK con advertencias. Puede servir para mock/pre-beta; revisa WARN antes de pruebas reales." : "OK Riot readiness aprobado.");



