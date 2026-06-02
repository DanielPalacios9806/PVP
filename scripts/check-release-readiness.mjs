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
check("Mapa de navegaciÃ³n frontend existe", file("apps/web/lib/navigation-map.ts"));
check("Mapa de librerÃ­as externas existe", file("apps/web/lib/external-ui-map.ts"));
check("Home External UI Fusion documentado", file("docs/HOME_EXTERNAL_UI_FUSION.md"));
check("Tournament detail mockup fidelity documentado", file("docs/TOURNAMENT_DETAIL_MOCKUP_FIDELITY.md"));
check("Tournament detail pro bracket documentado", file("docs/TOURNAMENT_DETAIL_PRO_BRACKET.md"));
check("Tournament detail layout fidelity documentado", file("docs/TOURNAMENT_DETAIL_LAYOUT_FIDELITY.md"));
check("Tournaments hub layout fidelity documentado", file("docs/TOURNAMENTS_HUB_LAYOUT_FIDELITY.md"));
check("Tournaments hub mobile polish documentado", file("docs/TOURNAMENTS_HUB_MOBILE_POLISH.md"));
check("Right activity rail UX documentado", file("docs/RIGHT_ACTIVITY_RAIL_UX.md"));
check("Right activity rail global documentado", file("docs/RIGHT_ACTIVITY_RAIL_GLOBAL.md"));
check("Teams hub layout fidelity documentado", file("docs/TEAMS_HUB_LAYOUT_FIDELITY.md"));
check("Account Riot profile UX documentado", file("docs/ACCOUNT_RIOT_PROFILE_UX.md"));
check("Admin Ops center polish documentado", file("docs/ADMIN_OPS_CENTER_POLISH.md"));
check("Riot key rotation y Render env documentado", file("docs/RIOT_KEY_ROTATION_AND_RENDER_ENV.md"));
check("Pre-beta deploy checklist documentado", file("docs/PRE_BETA_DEPLOY_CHECKLIST.md"));
check("Main release bridge documentado", file("docs/MAIN_RELEASE_BRIDGE.md"));
check("Production hardening documentado", file("docs/PRODUCTION_HARDENING.md"));
check("Render Supabase runtime documentado", file("docs/RENDER_SUPABASE_RUNTIME.md"));
check("Incident rollback runbook documentado", file("docs/INCIDENT_ROLLBACK_RUNBOOK.md"));
check("Visual QA screenshots documentado", file("docs/VISUAL_QA_SCREENSHOTS.md"));
check("Riot application package documentado", file("docs/RIOT_APPLICATION_PACKAGE.md"));
check("Riot compliance matrix documentado", file("docs/RIOT_COMPLIANCE_MATRIX.md"));
check("Riot demo script documentado", file("docs/RIOT_DEMO_SCRIPT.md"));
check("Riot API usage map documentado", file("docs/RIOT_API_USAGE_MAP.md"));
check("Riot screenshot evidence documentado", file("docs/RIOT_SCREENSHOT_EVIDENCE.md"));
check("Riot production request draft documentado", file("docs/RIOT_PRODUCTION_REQUEST_DRAFT.md"));
check("Riot application checklist documentado", file("docs/RIOT_APPLICATION_CHECKLIST.md"));
check("Script Riot readiness existe", file("scripts/riot-readiness-check.mjs"));
check("Script pre-beta smoke existe", file("scripts/prebeta-smoke-check.mjs"));
check("Script Render env audit existe", file("scripts/render-env-audit.mjs"));
check("Script production health existe", file("scripts/production-health-check.mjs"));
check("Script visual QA screenshots existe", file("scripts/visual-qa-screenshots.mjs"));
check("Script Riot application package existe", file("scripts/riot-application-package-check.mjs"));

const riotApplicationPackage = file("docs/RIOT_APPLICATION_PACKAGE.md") ? read("docs/RIOT_APPLICATION_PACKAGE.md") : "";
const riotComplianceMatrix = file("docs/RIOT_COMPLIANCE_MATRIX.md") ? read("docs/RIOT_COMPLIANCE_MATRIX.md") : "";
const riotDemoScript = file("docs/RIOT_DEMO_SCRIPT.md") ? read("docs/RIOT_DEMO_SCRIPT.md") : "";
const riotApiUsageMap = file("docs/RIOT_API_USAGE_MAP.md") ? read("docs/RIOT_API_USAGE_MAP.md") : "";
const riotProductionDraft = file("docs/RIOT_PRODUCTION_REQUEST_DRAFT.md") ? read("docs/RIOT_PRODUCTION_REQUEST_DRAFT.md") : "";
check("Riot package describe producto y arquitectura", riotApplicationPackage.includes("Darkside.cool") && riotApplicationPackage.includes("Arena OS") && /Modular monolith|monolito modular/i.test(riotApplicationPackage));
check("Riot usage map cubre RSO y Tournament API", riotApiUsageMap.includes("RSO") && riotApiUsageMap.includes("Tournament API") && riotApiUsageMap.includes("backend"));
check("Riot compliance matrix cubre no frontend key", riotComplianceMatrix.includes("NEXT_PUBLIC_RIOT_API_KEY") && riotComplianceMatrix.includes("non-monetary"));
check("Riot demo script cubre flujos principales", riotDemoScript.includes("Tournaments Hub") && riotDemoScript.includes("Account") && riotDemoScript.includes("Admin"));
check("Riot production draft listo", riotProductionDraft.includes("web-based esports tournament platform") && riotProductionDraft.includes("backend"));

const accountCenter = file("apps/web/components/account-center.tsx") ? read("apps/web/components/account-center.tsx") : "";
check("Account dashboard muestra estado Riot", accountCenter.includes("Riot readiness") && accountCenter.includes("RiotLinkCard") && accountCenter.includes("RIOT backend protegido"));
check("Account dashboard no expone RIOT_API_KEY", !accountCenter.includes("RIOT_API_KEY") && !accountCenter.includes("NEXT_PUBLIC_RIOT_API_KEY"));
check("Account dashboard tiene accesos competitivos", accountCenter.includes("Mis torneos") && accountCenter.includes("Mis equipos") && accountCenter.includes("Mis tokens"));
check("Account dashboard separa Admin por rol", accountCenter.includes("adminLike") && accountCenter.includes("/dashboard/admin") && accountCenter.includes("rol autorizado"));

const adminPage = file("apps/web/app/dashboard/admin/page.tsx") ? read("apps/web/app/dashboard/admin/page.tsx") : "";
const adminOpsCenter = file("apps/web/components/admin-ops-command-center.tsx") ? read("apps/web/components/admin-ops-command-center.tsx") : "";
const adminQuickAccess = file("apps/web/components/admin-quick-access.tsx") ? read("apps/web/components/admin-quick-access.tsx") : "";
const adminTokenPanel = file("apps/web/components/admin-token-panel.tsx") ? read("apps/web/components/admin-token-panel.tsx") : "";
const moderationPage = file("apps/web/app/dashboard/moderation/page.tsx") ? read("apps/web/app/dashboard/moderation/page.tsx") : "";
check("Admin page usa Ops Command Center", adminPage.includes("AdminOpsCommandCenter") && adminPage.includes("auditoria-operativa") && adminPage.includes("tokens-internos"));
check("Admin Ops center separa roles", adminOpsCenter.includes("opsCards") && adminOpsCenter.includes("SUPER_ADMIN") && adminOpsCenter.includes("MODERATOR") && adminOpsCenter.includes("API key vive solo en backend"));
check("Admin quick access usa rutas operativas", adminQuickAccess.includes("Operacion Riot") && adminQuickAccess.includes("Auditoria") && adminQuickAccess.includes("/dashboard/moderation"));
check("Admin token panel declara tokens no monetarios", adminTokenPanel.includes("Token Ledger") && adminTokenPanel.includes("no monetarios") && adminTokenPanel.includes("No representa dinero real"));
check("Moderation page usa war room", moderationPage.includes("Moderacion / War room") && moderationPage.includes("integridad competitiva"));

const apiRoutes = file("apps/api/src/routes/index.ts") ? read("apps/api/src/routes/index.ts") : "";
const apiEnv = file("apps/api/src/config/env.ts") ? read("apps/api/src/config/env.ts") : "";
check("API expone health runtime", apiRoutes.includes('/health/runtime') && apiRoutes.includes("corsOriginsConfigured") && apiRoutes.includes("getRiotRuntimeConfig"));
check("API expone readiness DB", apiRoutes.includes('/health/readiness') && apiRoutes.includes("prisma.$queryRaw") && apiRoutes.includes("database"));
check("API env declara SERVER_ENV", apiEnv.includes("SERVER_ENV") && apiEnv.includes("staging"));
check("API env declara DIRECT_URL opcional", apiEnv.includes("DIRECT_URL"));

const publicLanding = file("apps/web/components/public-landing.tsx") ? read("apps/web/components/public-landing.tsx") : "";
check("Home pÃºblica usa Motion", publicLanding.includes('from "motion/react"'));
check("Home pÃºblica usa Lucide React", publicLanding.includes('from "lucide-react"'));
check("Home pÃºblica mantiene hero Darkside oficial", publicLanding.includes("heroDesktop") && publicLanding.includes("heroMobile"));
check("Home pÃºblica oculta navegaciÃ³n admin directa", !publicLanding.includes("/dashboard/admin") && !publicLanding.includes("/dashboard/moderation"));

const tournamentDetail = file("apps/web/components/tournament-detail.tsx") ? read("apps/web/components/tournament-detail.tsx") : "";
check("Tournament detail usa hero oficial Darkside", tournamentDetail.includes("hero-desktop.jpg"));
check("Tournament detail no expone tab Automatizacion publica", !tournamentDetail.includes("Automatizacion") && !tournamentDetail.includes("Automatización"));
const hasTournamentContextPanel = tournamentDetail.includes("tournament-main-stage") && tournamentDetail.includes("xl:grid-cols-[minmax(0,1fr)_330px]");
check("Tournament detail usa panel lateral contextual", hasTournamentContextPanel);
check("Tournament detail contador vivo", tournamentDetail.includes("setInterval") && tournamentDetail.includes("countdownNow"));
check("Tournament detail usa layout 70/30", tournamentDetail.includes("xl:grid-cols-[minmax(0,1fr)_330px]") && tournamentDetail.includes("tournament-main-stage"));
const bracketBoard = file("apps/web/components/bracket-board.tsx") ? read("apps/web/components/bracket-board.tsx") : "";
check("Bracket usa XYFlow", bracketBoard.includes("@xyflow/react") && bracketBoard.includes("ReactFlow") && bracketBoard.includes("fitView"));
check("Bracket permite pan y zoom", bracketBoard.includes("panOnScroll") && bracketBoard.includes("Controls"));
check("Bracket mobile usa vista por rondas", bracketBoard.includes("MobileRoundCards") && bracketBoard.includes("md:hidden"));
check("Layout carga estilos XYFlow", file("apps/web/app/layout.tsx") && read("apps/web/app/layout.tsx").includes("@xyflow/react/dist/style.css"));

const tournamentsHub = file("apps/web/components/tournaments-hub.tsx") ? read("apps/web/components/tournaments-hub.tsx") : "";
check("Tournaments hub usa stage dedicado", tournamentsHub.includes("tournaments-hub-stage") && tournamentsHub.includes("Arena competitiva"));
check("Tournaments hub tiene busqueda funcional", tournamentsHub.includes("normalizeForSearch") && tournamentsHub.includes("setQuery"));
check("Tournaments hub distribuye cards premium", tournamentsHub.includes("tournaments-hub-card") && tournamentsHub.includes("xl:grid-cols-[260px_minmax(0,1fr)_210px]"));
check("Tournaments hub usa filtros mobile drawer", tournamentsHub.includes("tournaments-mobile-command") && tournamentsHub.includes("mobileFilterPanel") && tournamentsHub.includes("Dialog.Content"));
check("Tournaments hub oculta sidebar en mobile", tournamentsHub.includes("hidden space-y-5 lg:sticky") && tournamentsHub.includes("lg:block"));

const dashboardGridWrapper = file("apps/web/components/dashboard-grid-wrapper.tsx") ? read("apps/web/components/dashboard-grid-wrapper.tsx") : "";
check("Dashboard mantiene rail derecho colapsable en torneos", dashboardGridWrapper.includes("rightRailExpandedColumns") && dashboardGridWrapper.includes("rightRailCollapsedColumns") && dashboardGridWrapper.includes("shouldRenderRightRail = showRightSidebar && Boolean(rightSidebar)"));
check("Dashboard rail derecho es colapsable", dashboardGridWrapper.includes("darkside:right-activity-rail-collapsed") && dashboardGridWrapper.includes("CollapsedActivityRail"));

const sidebarRight = file("apps/web/components/sidebar-right.tsx") ? read("apps/web/components/sidebar-right.tsx") : "";
check("Right rail muestra actividad util", sidebarRight.includes("Your activities") && sidebarRight.includes("Your party") && sidebarRight.includes("Your teams"));

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
check("Dependencia UI externa declarada: @xyflow/react", webPackageJson.includes('"@xyflow/react"') || rootPackageJsonForUi.includes('"@xyflow/react"'));
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
check("Script check:riot existe", packageJson.includes('"check:riot"') && packageJson.includes("riot-readiness-check.mjs"));
check("Script check:prebeta existe", packageJson.includes('"check:prebeta"') && packageJson.includes("prebeta-smoke-check.mjs"));
check("Script check:render existe", packageJson.includes('"check:render"') && packageJson.includes("render-env-audit.mjs"));
check("Script check:prodhealth existe", packageJson.includes('"check:prodhealth"') && packageJson.includes("production-health-check.mjs"));
check("Script release:prebeta existe", packageJson.includes('"release:prebeta"'));
check("Script check:visual existe", packageJson.includes('"check:visual"') && packageJson.includes("visual-qa-screenshots.mjs"));
check("Script check:riotapp existe", packageJson.includes('"check:riotapp"') && packageJson.includes("riot-application-package-check.mjs"));
check("Script release:riotapp existe", packageJson.includes('"release:riotapp"'));
check("Script release:production existe", packageJson.includes('"release:production"'));

const gitignore = file(".gitignore") ? read(".gitignore") : "";
check("Visual QA artifacts ignorados", gitignore.includes("visual-qa-artifacts/"));
const nextConfig = file("apps/web/next.config.ts") ? read("apps/web/next.config.ts") : "";
check("Next standalone activo para Render", nextConfig.includes('output: "standalone"'));
check("Data Dragon permitido para imÃ¡genes", nextConfig.includes("ddragon.leagueoflegends.com"));

const renderYaml = file("render.yaml") ? read("render.yaml") : "";
const renderServiceBlocks = renderYaml.split(/\n\s*-\s*type:\s*web\s*\n/g);
const renderApiService = renderServiceBlocks.find((block) => /^\s*name:\s*arena-os-api-staging\s*$/m.test(block) || /startCommand:\s*npm\s+--workspace\s+apps\/api/i.test(block)) ?? renderYaml;
const renderWebService = renderServiceBlocks.find((block) => /^\s*name:\s*arena-os-web-staging\s*$/m.test(block) || /startCommand:\s*cd\s+apps\/web/i.test(block)) ?? "";
check("Render API declara RIOT_API_KEY sync:false", /^\s*-\s*key:\s*RIOT_API_KEY\s*$/m.test(renderApiService) && /RIOT_API_KEY[\s\S]{0,120}sync:\s*false/m.test(renderApiService));
check("Render API queda en modo Riot development para pre-beta", /^\s*-\s*key:\s*RIOT_API_MODE\s*$/m.test(renderApiService) && /RIOT_API_MODE[\s\S]{0,120}value:\s*development/m.test(renderApiService));
check("Render Web no declara RIOT_API_KEY privada", !/^\s*-\s*key:\s*RIOT_API_KEY\s*$/m.test(renderWebService));
check("Render Web no declara NEXT_PUBLIC_RIOT_API_KEY", !/NEXT_PUBLIC_RIOT_API_KEY/m.test(renderWebService));
check("Render Web apunta al API staging", /NEXT_PUBLIC_API_URL[\s\S]{0,120}arena-os-api-staging\.onrender\.com\/api/m.test(renderWebService));
check("Render API CORS incluye Web staging", renderApiService.includes("arena-os-web-staging-6x5f.onrender.com"));

const envExamples = [".env.example", ".env.render.example", ".env.server.example"].filter(file);
check("Existe al menos un env example", envExamples.length > 0);
const envText = envExamples.map(read).join("\n");
check("Env example documenta DATABASE_URL", envText.includes("DATABASE_URL"));
check("Env example documenta JWT_SECRET", envText.includes("JWT_SECRET"));
check("Env example documenta RIOT_API_KEY", envText.includes("RIOT_API_KEY"));
check("Env example no documenta NEXT_PUBLIC_RIOT_API_KEY", !envText.includes("NEXT_PUBLIC_RIOT_API_KEY="));
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
  console.log("FAIL La revisiÃ³n encontrÃ³ pendientes. Corrige antes de merge/deploy.");
  process.exit(1);
}

console.log("OK RevisiÃ³n local lista. Ejecuta build y smoke test antes de producciÃ³n.");
