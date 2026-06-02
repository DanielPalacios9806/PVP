#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
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
  console.log(`${condition ? "OK" : "WARN"} ${label}${!condition && hint ? ` -> ${hint}` : ""}`);
  if (!condition) warned = true;
}

const docs = [
  "docs/RIOT_APPLICATION_PACKAGE.md",
  "docs/RIOT_API_USAGE_MAP.md",
  "docs/RIOT_COMPLIANCE_MATRIX.md",
  "docs/RIOT_DEMO_SCRIPT.md",
  "docs/RIOT_SCREENSHOT_EVIDENCE.md",
  "docs/RIOT_PRODUCTION_REQUEST_DRAFT.md",
  "docs/RIOT_APPLICATION_CHECKLIST.md",
  "docs/RIOT_SUBMISSION_FINAL_CHECKLIST.md",
  "docs/RIOT_PORTAL_FIELD_ANSWERS.md",
  "docs/RIOT_SUBMISSION_EVIDENCE_INDEX.md",
  "docs/RIOT_SUBMISSION_RISK_NOTES.md",
  "docs/RIOT_FINAL_DEMO_RUNBOOK.md"
];

console.log("Darkside.cool Riot final submission check");
console.log("==========================================");

for (const doc of docs) {
  ok(`Documento final Riot existe: ${doc}`, file(doc));
}

const allDocs = docs.map(read).join("\n");
const packageJson = read("package.json");
const renderYaml = read("render.yaml");
const envExamples = [".env.example", ".env.render.example", ".env.server.example"].map(read).join("\n");

ok("Submission package menciona Darkside", /Darkside\.cool|Arena OS/i.test(allDocs));
ok("Submission package declara backend-only Riot API", /backend-only|backend API|backend/i.test(allDocs) && /RIOT_API_KEY/i.test(allDocs));
ok("Submission package declara monolito modular", /monolito modular|modular monolith/i.test(allDocs));
ok("Submission package cubre RSO como futuro/aprobacion", /RSO/i.test(allDocs) && /aprob|approval|future|futuro|production/i.test(allDocs));
ok("Submission package cubre Tournament API como futuro/aprobacion", /Tournament API/i.test(allDocs) && /aprob|approval|future|futuro|production/i.test(allDocs));
ok("Submission package cubre tokens no monetarios", /no monetario|non-monetary/i.test(allDocs));
ok("Submission package incluye URLs staging", allDocs.includes("arena-os-web-staging") && allDocs.includes("arena-os-api-staging"));
ok("Submission package incluye legal pages", /privacy|terms|data deletion|privacidad|terminos/i.test(allDocs));
ok("Submission package exige rotar key", /rotar|rotate/i.test(allDocs) && /RIOT_API_KEY/i.test(allDocs));
ok("Docs no contienen una Riot API key real", !/RGAPI-[A-Za-z0-9_-]{10,}/.test(allDocs));
ok("Docs advierten no usar NEXT_PUBLIC_RIOT_API_KEY", allDocs.includes("NEXT_PUBLIC_RIOT_API_KEY"));
ok("package.json declara check:riotsubmit", packageJson.includes('"check:riotsubmit"'));
ok("package.json declara release:riotsubmit", packageJson.includes('"release:riotsubmit"'));
ok("Render API mantiene RIOT_API_KEY sync:false", /RIOT_API_KEY[\s\S]{0,120}sync:\s*false/m.test(renderYaml));
ok("Render Web no declara NEXT_PUBLIC_RIOT_API_KEY", !/NEXT_PUBLIC_RIOT_API_KEY/m.test(renderYaml));
ok("Env examples no exponen NEXT_PUBLIC_RIOT_API_KEY", !/NEXT_PUBLIC_RIOT_API_KEY\s*=/.test(envExamples));

const visualRoot = path.join(root, "visual-qa-artifacts");
const hasVisualArtifacts = existsSync(visualRoot) && readdirSync(visualRoot).some((entry) => {
  const report = path.join(visualRoot, entry, "VISUAL_QA_REPORT.md");
  const manifest = path.join(visualRoot, entry, "manifest.json");
  return existsSync(report) && existsSync(manifest);
});
warn("Visual QA artifacts disponibles localmente", hasVisualArtifacts, "ejecuta npm run check:visual antes de la demo final");

console.log("\nResumen:");
if (failed) {
  console.log("FAIL Riot final submission con pendientes.");
  process.exit(1);
}
console.log(warned ? "OK con advertencias. Revisa WARN antes de enviar formalmente." : "OK Riot final submission listo.");
