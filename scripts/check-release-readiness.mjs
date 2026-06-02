#!/usr/bin/env node
import { execFileSync } from "node:child_process";
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

function isIgnoredPath(relativePath) {
  return (
    relativePath === ".git" ||
    relativePath.startsWith(".git/") ||
    relativePath.includes("/node_modules/") ||
    relativePath === "node_modules" ||
    relativePath.includes("/.next/") ||
    relativePath.includes("/dist/") ||
    relativePath.includes("/build/") ||
    relativePath.includes("/coverage/") ||
    relativePath.endsWith(".zip") ||
    relativePath.endsWith(".7z") ||
    relativePath.endsWith(".rar") ||
    relativePath.includes("riot_final_qa_review") ||
    relativePath.includes("riot_visual_assets_review") ||
    relativePath.includes("darkside_local_review_") ||
    relativePath.includes("_review_meta/")
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
    else if (stat.size <= 750_000) files.push(rel);
  }
  return files;
}

function trackedFiles() {
  try {
    return execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((relativePath) => !isIgnoredPath(relativePath));
  } catch {
    return walk(root);
  }
}

function looksLikePlaceholder(value) {
  const normalized = value.toLowerCase();
  return (
    value.includes("<") ||
    value.includes(">") ||
    value.includes("...") ||
    value.includes("***") ||
    normalized.includes("placeholder") ||
    normalized.includes("replace") ||
    normalized.includes("example") ||
    normalized.includes("change-me") ||
    normalized.includes("local") ||
    normalized.includes("dummy") ||
    normalized.includes("sample") ||
    normalized.includes("your_") ||
    normalized.includes("your-") ||
    normalized.includes("password") ||
    normalized.includes("secret") ||
    normalized.includes("token") ||
    normalized.includes("project_ref") ||
    normalized.includes("project-ref")
  );
}

function isDocumentationPath(relativePath) {
  return (
    relativePath.endsWith(".md") ||
    relativePath.endsWith(".txt") ||
    relativePath.startsWith("docs/") ||
    relativePath.toLowerCase().startsWith("readme")
  );
}

function isEnvExamplePath(relativePath) {
  return (
    relativePath.endsWith(".env.example") ||
    relativePath.endsWith(".env.render.example") ||
    relativePath.endsWith(".env.server.example")
  );
}

function scanSecrets(relativePath, content) {
  const findings = [];
  const documentation = isDocumentationPath(relativePath);

  // A real Riot key must never be committed, even in documentation.
  if (/RGAPI-[A-Za-z0-9_-]{10,}/.test(content)) {
    findings.push("Riot API key real");
  }

  // Only flag NEXT_PUBLIC_RIOT when it looks like an actual env assignment.
  // Mentions in docs such as "no usar NEXT_PUBLIC_RIOT" are allowed.
  for (const match of content.matchAll(/^\s*(NEXT_PUBLIC_[A-Z0-9_]*RIOT[A-Z0-9_]*)\s*=\s*["']?([^"'\r\n#]*)/gim)) {
    const value = match[2].trim();
    if (value && !looksLikePlaceholder(value)) {
      findings.push(`${match[1]} definido con valor`);
      break;
    }
  }

  // Markdown can include safe examples and anti-pattern notes. For docs, keep the
  // hard Riot-key check above and avoid noisy false positives for examples.
  if (documentation || relativePath === "scripts/check-release-readiness.mjs") {
    return findings;
  }

  for (const match of content.matchAll(/JWT_SECRET\s*=\s*["']?([^"'\r\n#]+)/gi)) {
    const value = match[1].trim();
    if (value.length >= 24 && !looksLikePlaceholder(value)) {
      findings.push("JWT literal largo");
      break;
    }
  }

  for (const match of content.matchAll(/postgresql:\/\/[^\s"']+/gi)) {
    const value = match[0].trim();
    const isLocal = value.includes("localhost") || value.includes("127.0.0.1");
    if (!isLocal && !isEnvExamplePath(relativePath) && !looksLikePlaceholder(value)) {
      findings.push("Postgres URL literal");
      break;
    }
  }

  return findings;
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
check("Design system Darkside documentado", file("docs/DARKSIDE_DESIGN_SYSTEM.md"));
check("Design tokens frontend existen", file("apps/web/lib/design-tokens.ts"));
check("Primitivos UI Darkside existen", file("apps/web/components/ui/ds-primitives.tsx"));

check("External UI Fusion documentado", file("docs/EXTERNAL_UI_FUSION.md"));
check("Mapa funcional UX documentado", file("docs/UX_NAVIGATION_FUNCTIONAL_MAP.md"));
check("Mapa de navegación frontend existe", file("apps/web/lib/navigation-map.ts"));
check("Mapa de librerías externas existe", file("apps/web/lib/external-ui-map.ts"));
check("Home External UI Fusion documentado", file("docs/HOME_EXTERNAL_UI_FUSION.md"));

const publicLanding = file("apps/web/components/public-landing.tsx") ? read("apps/web/components/public-landing.tsx") : "";
check("Home pública usa Motion", publicLanding.includes('from "motion/react"'));
check("Home pública usa Lucide React", publicLanding.includes('from "lucide-react"'));
check("Home pública mantiene hero Darkside oficial", publicLanding.includes("heroDesktop") && publicLanding.includes("heroMobile"));
check("Home pública oculta navegación admin directa", !publicLanding.includes("/dashboard/admin") && !publicLanding.includes("/dashboard/moderation"));

const webPackageJson = file("apps/web/package.json") ? read("apps/web/package.json") : "";
const requiredWebDeps = [
  "@radix-ui/react-dialog",
  "@radix-ui/react-dropdown-menu",
  "@radix-ui/react-tabs",
  "@radix-ui/react-tooltip",
  "@radix-ui/react-popover",
  "@radix-ui/react-navigation-menu",
  "@radix-ui/react-accordion",
  "@radix-ui/react-select",
  "@radix-ui/react-switch",
  "motion",
  "lucide-react",
  "embla-carousel-react",
  "recharts",
  "clsx",
  "tailwind-merge"
];

for (const dependency of requiredWebDeps) {
  check(`Dependencia UI externa declarada: ${dependency}`, webPackageJson.includes(`"${dependency}"`));
}

const rootPackageJsonForUi = file("package.json") ? read("package.json") : "";
check("Playwright declarado para QA visual", rootPackageJsonForUi.includes('"@playwright/test"'));

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
for (const relativePath of trackedFiles()) {
  const full = path.join(root, relativePath);
  let content = "";
  try {
    content = readFileSync(full, "utf8");
  } catch {
    continue;
  }

  const findings = scanSecrets(relativePath, content);
  for (const finding of findings) {
    suspicious.push(`${relativePath} :: ${finding}`);
  }
}

check(
  "No hay patrones obvios de secretos en archivos versionados",
  suspicious.length === 0,
  suspicious.slice(0, 10).join(" | ")
);

console.log("\nResumen:");
if (failed) {
  console.log("FAIL La revisión encontró pendientes. Corrige antes de merge/deploy.");
  process.exit(1);
}

console.log("OK Revisión local lista. Ejecuta build y smoke test antes de producción.");
