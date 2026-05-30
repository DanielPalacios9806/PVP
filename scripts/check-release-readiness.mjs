#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
let failed = false;

function check(label, condition, hint = "") {
  const icon = condition ? "OK" : "FAIL";
  console.log(`${icon} ${label}${hint && !condition ? ` -> ${hint}` : ""}`);
  if (!condition) failed = true;
}

function file(relativePath) {
  return existsSync(path.join(root, relativePath));
}

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const rel = path.relative(root, full).replaceAll(path.sep, "/");
    if (
      entry === "node_modules" ||
      entry === ".git" ||
      entry === ".next" ||
      entry === "dist" ||
      entry === "build" ||
      entry === "coverage" ||
      entry.endsWith(".zip") ||
      rel.includes("riot_final_qa_review") ||
      rel.includes("riot_visual_assets_review") ||
      rel.includes("darkside_local_review_")
    ) {
      continue;
    }

    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (stat.size <= 750_000) files.push(full);
  }
  return files;
}

console.log("Darkside.cool release readiness check");
console.log("======================================");

check("package.json existe", file("package.json"));
check("API package existe", file("apps/api/package.json"));
check("Web package existe", file("apps/web/package.json"));
check("Prisma schema existe", file("prisma/schema.prisma"));

check("Dashboard base existe en /dashboard", file("apps/web/app/dashboard/page.tsx"));
check("Account dashboard existe", file("apps/web/app/dashboard/account/page.tsx"));
check("Legal Terms existe", file("apps/web/app/legal/terms/page.tsx"));
check("Legal Privacy existe", file("apps/web/app/legal/privacy/page.tsx"));
check("Legal Data Deletion existe", file("apps/web/app/legal/data-deletion/page.tsx"));
check("Plan Riot existe", file("docs/RIOT_INTEGRATION_PLAN.md"));
check("QA checklist existe", file("docs/QA_CHECKLIST.md"));

check(
  "No existe ruta duplicada dashboard/dashboard",
  !file("apps/web/app/dashboard/dashboard"),
  "elimina o mueve la ruta duplicada"
);
check(
  "No existe ruta duplicada legal/legal",
  !file("apps/web/app/legal/legal"),
  "elimina o mueve la ruta duplicada"
);
check(
  "No existe carpeta duplicada public/images/images",
  !file("apps/web/public/images/images"),
  "normaliza assets a apps/web/public/images"
);

const packageJson = read("package.json");
check("Script build existe", packageJson.includes('"build"'));
check("Script build:api existe", packageJson.includes('"build:api"'));
check("Script build:web existe", packageJson.includes('"build:web"'));
check("Script check:release existe", packageJson.includes('"check:release"'));
check("Script check:smoke existe", packageJson.includes('"check:smoke"'));

const nextConfig = file("apps/web/next.config.ts") ? read("apps/web/next.config.ts") : "";
check("Next standalone activo para Render", nextConfig.includes('output: "standalone"'));
check("Data Dragon permitido para imágenes", nextConfig.includes("ddragon.leagueoflegends.com"));

const envExamples = [".env.example", ".env.render.example", ".env.server.example"].filter(file);
check("Existe al menos un env example", envExamples.length > 0);
const envText = envExamples.map(read).join("\n");
check("Env example documenta DATABASE_URL", envText.includes("DATABASE_URL"));
check("Env example documenta JWT_SECRET", envText.includes("JWT_SECRET"));
check("Env example documenta RIOT_API_KEY", envText.includes("RIOT_API_KEY"));
check("Env example documenta CORS/FRONTEND", envText.includes("CORS_ORIGIN") || envText.includes("CORS_ORIGINS"));

const suspicious = [];
const secretPatterns = [
  { name: "Riot API key real", pattern: /RGAPI-[A-Za-z0-9_-]+/ },
  { name: "Riot key expuesta en NEXT_PUBLIC", pattern: /NEXT_PUBLIC_RIOT/i },
  { name: "JWT literal largo", pattern: /JWT_SECRET\s*=\s*["']?[A-Za-z0-9_-]{24,}/ },
  { name: "Postgres URL literal", pattern: /postgresql:\/\/[^\s"']+/i }
];

for (const full of walk(root)) {
  const rel = path.relative(root, full).replaceAll(path.sep, "/");
  if (rel.startsWith("scripts/")) continue;
  let content = "";
  try {
    content = readFileSync(full, "utf8");
  } catch {
    continue;
  }
  for (const { name, pattern } of secretPatterns) {
    if (pattern.test(content)) suspicious.push(`${rel} :: ${name}`);
  }
}

check("No hay patrones obvios de secretos en archivos revisados", suspicious.length === 0, suspicious.slice(0, 10).join(" | "));

console.log("\nResumen:");
if (failed) {
  console.log("FAIL La revisión encontró pendientes. Corrige antes de merge/deploy.");
  process.exit(1);
}

console.log("OK Revisión local lista. Ejecuta build y smoke test antes de producción.");
