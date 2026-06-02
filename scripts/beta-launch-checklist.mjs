#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
let failed = false;
let warned = false;

function file(relativePath) {
  return existsSync(path.join(root, relativePath));
}

function read(relativePath) {
  return file(relativePath) ? readFileSync(path.join(root, relativePath), "utf8") : "";
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

function hasRecentVisualArtifacts() {
  const dir = path.join(root, "visual-qa-artifacts");
  if (!existsSync(dir)) return false;
  const runs = readdirSync(dir)
    .map((entry) => path.join(dir, entry))
    .filter((full) => statSync(full).isDirectory());
  return runs.some((full) => existsSync(path.join(full, "VISUAL_QA_REPORT.md")) && existsSync(path.join(full, "manifest.json")));
}

const packageJson = read("package.json");
const releaseDocs = [
  "docs/BETA_LAUNCH_CHECKLIST.md",
  "docs/BETA_TESTER_GUIDE.md",
  "docs/BETA_ROLLBACK_AND_SUPPORT.md",
  "docs/BETA_RELEASE_NOTES_DRAFT.md",
  "docs/RIOT_APPLICATION_PACKAGE.md",
  "docs/RIOT_COMPLIANCE_MATRIX.md",
  "docs/PRE_BETA_DEPLOY_CHECKLIST.md",
  "docs/PRODUCTION_HARDENING.md",
  "docs/VISUAL_QA_SCREENSHOTS.md"
];

const allDocsText = releaseDocs.map(read).join("\n");

console.log("Darkside.cool beta launch checklist");
console.log("====================================");
console.log("");

for (const doc of releaseDocs) {
  ok(`Documento requerido existe: ${doc}`, file(doc));
}

ok("package.json declara check:release", packageJson.includes('"check:release"'));
ok("package.json declara check:riot", packageJson.includes('"check:riot"'));
ok("package.json declara check:riotapp", packageJson.includes('"check:riotapp"'));
ok("package.json declara check:prodhealth", packageJson.includes('"check:prodhealth"'));
ok("package.json declara check:visual", packageJson.includes('"check:visual"'));
ok("package.json declara check:beta", packageJson.includes('"check:beta"'));
ok("package.json declara release:beta", packageJson.includes('"release:beta"'));

ok("Checklist menciona Web staging", allDocsText.includes("arena-os-web-staging-6x5f.onrender.com"));
ok("Checklist menciona API staging", allDocsText.includes("arena-os-api-staging.onrender.com"));
ok("Checklist advierte no usar NEXT_PUBLIC_RIOT_API_KEY", allDocsText.includes("NEXT_PUBLIC_RIOT_API_KEY"));
ok("Checklist mantiene Riot advanced como pendiente aprobación", allDocsText.includes("pendiente de aprobación Riot") || allDocsText.includes("pendientes de aprobación Riot"));
ok("Checklist declara tokens internos no monetarios", /no monetario|no monetarios/i.test(allDocsText));
ok("Rollback documenta RIOT_API_MODE=mock", allDocsText.includes("RIOT_API_MODE=mock"));
ok("Beta guide define formato de reporte", allDocsText.includes("Formato de reporte"));

const suspiciousRiotKeys = /RGAPI-[A-Za-z0-9_-]{10,}/.test(allDocsText);
ok("Documentos beta no contienen Riot API key real", !suspiciousRiotKeys);

warn("Visual QA artifacts disponibles localmente", hasRecentVisualArtifacts(), "ejecuta npm run check:visual antes de compartir la beta");

console.log("\nResumen:");
if (failed) {
  console.log("FAIL Beta launch checklist con pendientes.");
  process.exit(1);
}

console.log(warned ? "OK con advertencias. La beta puede continuar si las advertencias están aceptadas." : "OK Beta launch checklist aprobado.");

