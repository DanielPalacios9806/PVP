#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
let failed = false;
let warned = false;

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

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

function extractServiceBlock(renderYaml, serviceName) {
  const lines = renderYaml.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `name: ${serviceName}`);
  if (start === -1) return "";

  const previousType = [...lines.slice(0, start)].reverse().findIndex((line) => /^\s*-\s+type:\s+web\s*$/.test(line));
  const blockStart = previousType === -1 ? start : start - previousType - 1;
  const nextService = lines.findIndex((line, index) => index > start && /^\s*-\s+type:\s+web\s*$/.test(line));
  return lines.slice(blockStart, nextService === -1 ? undefined : nextService).join("\n");
}

function hasKey(block, key) {
  return new RegExp(`^\\s*-\\s*key:\\s*${key}\\s*$`, "m").test(block);
}

function hasKeyValue(block, key, valuePattern) {
  const keyMatch = new RegExp(`^\\s*-\\s*key:\\s*${key}\\s*$`, "m").exec(block);
  if (!keyMatch) return false;
  const after = block.slice(keyMatch.index, keyMatch.index + 240);
  return valuePattern.test(after);
}

console.log("Darkside.cool Render env audit");
console.log("==============================");

if (!existsSync(path.join(root, "render.yaml"))) {
  ok("render.yaml existe", false);
} else {
  ok("render.yaml existe", true);
}

const renderYaml = existsSync(path.join(root, "render.yaml")) ? read("render.yaml") : "";
const apiBlock = extractServiceBlock(renderYaml, "arena-os-api-staging") || renderYaml;
const webBlock = extractServiceBlock(renderYaml, "arena-os-web-staging") || renderYaml;

ok("Render API service detectado", apiBlock.includes("arena-os-api-staging"));
ok("Render Web service detectado", webBlock.includes("arena-os-web-staging"));
ok("Render API usa migrate deploy preDeploy", /preDeployCommand:\s*npm run db:migrate:deploy/.test(apiBlock));
ok("Render API declara DATABASE_URL privado", hasKeyValue(apiBlock, "DATABASE_URL", /sync:\s*false/));
warn("Render API declara DIRECT_URL privado", hasKeyValue(apiBlock, "DIRECT_URL", /sync:\s*false/), "recomendado para Prisma migrate/operaciones directas");
ok("Render API declara JWT_SECRET privado", hasKeyValue(apiBlock, "JWT_SECRET", /sync:\s*false/));
ok("Render API declara RIOT_API_KEY privado", hasKeyValue(apiBlock, "RIOT_API_KEY", /sync:\s*false/));
ok("Render API declara RIOT_API_MODE", hasKey(apiBlock, "RIOT_API_MODE"));
ok("Render API declara RIOT_TOURNAMENT_API_ENABLED", hasKey(apiBlock, "RIOT_TOURNAMENT_API_ENABLED"));
ok("Render API CORS incluye staging web", apiBlock.includes("arena-os-web-staging-6x5f.onrender.com"));
ok("Render API conserva dominio final Darkside en CORS", apiBlock.includes("darkside.cool"));
ok("Render Web apunta al API staging", hasKeyValue(webBlock, "NEXT_PUBLIC_API_URL", /arena-os-api-staging\.onrender\.com\/api/));
ok("Render Web no declara RIOT_API_KEY", !hasKey(webBlock, "RIOT_API_KEY"));
ok("Render Web no declara NEXT_PUBLIC_RIOT_API_KEY", !hasKey(webBlock, "NEXT_PUBLIC_RIOT_API_KEY"));
ok("Render Web declara Supabase publishable key privada/sync", hasKey(webBlock, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"));
ok("Render Web declara Supabase URL", hasKey(webBlock, "NEXT_PUBLIC_SUPABASE_URL"));

console.log("\nResumen:");
if (failed) {
  console.log("FAIL Auditoria Render con pendientes. Corrige render.yaml o variables del Dashboard antes de producción.");
  process.exit(1);
}

console.log(warned ? "OK con advertencias. Revisa WARN antes de producción final." : "OK Render env audit aprobado.");
