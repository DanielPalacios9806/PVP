#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
let failed = false;
let warned = false;

function read(relativePath) {
  const full = path.join(root, relativePath);
  return existsSync(full) ? readFileSync(full, "utf8") : "";
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

function file(relativePath) {
  return existsSync(path.join(root, relativePath));
}

const docs = {
  package: "docs/RIOT_APPLICATION_PACKAGE.md",
  usage: "docs/RIOT_API_USAGE_MAP.md",
  compliance: "docs/RIOT_COMPLIANCE_MATRIX.md",
  demo: "docs/RIOT_DEMO_SCRIPT.md",
  screenshots: "docs/RIOT_SCREENSHOT_EVIDENCE.md",
  draft: "docs/RIOT_PRODUCTION_REQUEST_DRAFT.md",
  checklist: "docs/RIOT_APPLICATION_CHECKLIST.md"
};

const allDocsText = Object.values(docs).map(read).join("\n");
const visualDocs = read(docs.screenshots);
const compliance = read(docs.compliance);
const draft = read(docs.draft);

console.log("Darkside.cool Riot application package check");
console.log("=============================================");

for (const [name, relativePath] of Object.entries(docs)) {
  ok(`Documento Riot application existe: ${name}`, file(relativePath));
}

ok("Package describe producto Darkside", read(docs.package).includes("Darkside.cool") && read(docs.package).includes("Arena OS"));
ok("Package declara monolito modular", /Modular monolith|monolito modular/i.test(read(docs.package)));
ok("Package documenta Web/API staging", read(docs.package).includes("arena-os-web-staging") && read(docs.package).includes("arena-os-api-staging"));
ok("Usage map menciona RSO", read(docs.usage).includes("RSO") && read(docs.usage).includes("OAuth"));
ok("Usage map mantiene Tournament API como aprobado futuro", read(docs.usage).includes("Tournament API") && read(docs.usage).includes("approval"));
ok("Compliance matrix cubre no frontend key", compliance.includes("NEXT_PUBLIC_RIOT_API_KEY") && compliance.includes("backend"));
ok("Compliance matrix cubre tokens no monetarios", compliance.includes("non-monetary") || compliance.includes("no monetario"));
ok("Demo script cubre Account Riot UX", read(docs.demo).includes("Account") && read(docs.demo).includes("Riot"));
ok("Screenshot evidence referencia visual QA", visualDocs.includes("visual-qa-artifacts") && visualDocs.includes("desktop-account.png") && visualDocs.includes("mobile-account.png"));
ok("Production request draft listo en ingles", draft.includes("Darkside.cool") && draft.includes("web-based esports tournament platform"));
ok("Checklist exige rotacion de key expuesta", read(docs.checklist).includes("rotated") || read(docs.checklist).includes("rotada"));

ok("Documentacion advierte no usar NEXT_PUBLIC_RIOT_API_KEY", allDocsText.includes("NEXT_PUBLIC_RIOT_API_KEY"));
ok("Documentacion no contiene Riot API key real", !/RGAPI-[A-Za-z0-9_-]{10,}/.test(allDocsText));
ok("Documentacion mantiene DS_TOKEN no monetario", /non-monetary|no monetario|no-monetary/i.test(allDocsText));
ok("Documentacion menciona legal pages", allDocsText.includes("/legal/terms") && allDocsText.includes("/legal/privacy") && allDocsText.includes("/legal/data-deletion"));

warn("Visual QA artifacts disponibles localmente", file("visual-qa-artifacts"), "no se versionan; genera con npm run check:visual antes de enviar evidencia");

console.log("\nResumen:");
if (failed) {
  console.log("FAIL Riot application package incompleto. Corrige docs antes de preparar solicitud formal.");
  process.exit(1);
}

console.log(warned ? "OK con advertencias no bloqueantes para pre-beta." : "OK Riot application package listo.");
