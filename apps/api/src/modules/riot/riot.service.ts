import { ExternalAccountProvider, RiotLinkedAccountStatus } from "@prisma/client";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { badRequest } from "../../utils/http-error.js";
import type { RiotAdapter } from "./riot.adapter.js";
import { getRiotRuntimeConfig, RiotApiError, riotRequest } from "./riot.client.js";
import { RiotMockAdapter } from "./riot.mock-adapter.js";
import { RiotRealAdapter } from "./riot.real-adapter.js";

type CapabilityStatus = "ok" | "empty" | "forbidden" | "not_found" | "rate_limited" | "unavailable" | "not_configured" | "skipped";

type CapabilityResult<T = Record<string, unknown>> = {
  status: CapabilityStatus;
  message?: string;
  data?: T;
  statusCode?: number;
  errorType?: string;
};

type RiotAccountDto = {
  puuid: string;
  gameName: string;
  tagLine: string;
};

type RiotSummonerDto = {
  id?: string;
  puuid?: string;
  profileIconId?: number;
  revisionDate?: number;
  summonerLevel?: number;
};

type RiotLeagueEntryDto = {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  veteran?: boolean;
  inactive?: boolean;
  freshBlood?: boolean;
  hotStreak?: boolean;
};

type RiotMatchParticipantDto = {
  puuid: string;
  riotIdGameName?: string;
  riotIdTagline?: string;
  championName?: string;
  championId?: number;
  teamPosition?: string;
  individualPosition?: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  win?: boolean;
  summonerLevel?: number;
  profileIcon?: number;
};

type RiotMatchDto = {
  metadata?: { matchId?: string };
  info?: {
    gameMode?: string;
    gameType?: string;
    gameDuration?: number;
    gameCreation?: number;
    gameEndTimestamp?: number;
    participants?: RiotMatchParticipantDto[];
  };
};

function statusFromRiotError(error: unknown): CapabilityStatus {
  if (error instanceof RiotApiError) {
    if (error.riotStatusCode === 404) return "not_found";
    if (error.riotStatusCode === 401 || error.riotStatusCode === 403) return "forbidden";
    if (error.riotStatusCode === 429) return "rate_limited";
    return "unavailable";
  }

  return "unavailable";
}

function capabilityError(error: unknown): CapabilityResult {
  if (error instanceof RiotApiError) {
    return {
      status: statusFromRiotError(error),
      statusCode: error.riotStatusCode,
      errorType: error.errorType,
      message: error.riotStatusCode === 403
        ? "Riot API rejected this request for the current key or endpoint."
        : error.message
    };
  }

  return {
    status: "unavailable",
    message: error instanceof Error ? error.message : "Unknown Riot capability error"
  };
}

function queueLabel(queueType: string) {
  const labels: Record<string, string> = {
    RANKED_SOLO_5x5: "SoloQ",
    RANKED_FLEX_SR: "Flex"
  };

  return labels[queueType] ?? queueType;
}

export function getRiotMode() {
  return env.RIOT_API_MODE;
}

export function getRiotAdapter(): RiotAdapter {
  if (env.RIOT_API_MODE === "mock") {
    return new RiotMockAdapter();
  }

  return new RiotRealAdapter();
}

function buildLookupMetadata(extra?: Record<string, unknown>) {
  return {
    mode: env.RIOT_API_MODE,
    source: env.RIOT_API_MODE === "mock" ? "mock-adapter" : "riot-api",
    verificationMethod: "LOOKUP_ONLY",
    ownershipVerified: false,
    officialRsoRequired: true,
    warning:
      "This confirms the Riot ID exists, but it does not prove that the current Darkside user owns the Riot account.",
    ...extra
  };
}

export async function checkRiotAccount(params: {
  gameName: string;
  tagLine: string;
  platformRoute: string;
  regionalRoute: string;
  userId?: string;
}) {
  const account = await getRiotAdapter().lookupAccountByRiotId({
    gameName: params.gameName,
    tagLine: params.tagLine,
    platformRoute: params.platformRoute,
    regionalRoute: params.regionalRoute
  });

  if (!account?.puuid) {
    throw badRequest("Riot account could not be resolved in the current mode");
  }

  return {
    ok: true,
    mode: env.RIOT_API_MODE,
    ownershipVerified: false,
    verificationMethod: "LOOKUP_ONLY",
    message:
      "Riot ID exists. Official ownership verification requires Riot Sign On approval and a Riot login flow.",
    account: {
      gameName: account.gameName,
      tagLine: account.tagLine,
      platformRoute: account.platformRoute,
      regionalRoute: account.regionalRoute,
      puuidPresent: Boolean(account.puuid),
      summonerIdPresent: Boolean(account.summonerId)
    }
  };
}

export async function linkRiotAccount(params: {
  userId: string;
  gameName: string;
  tagLine: string;
  game: string;
  platformRoute: string;
  regionalRoute: string;
}) {
  const account = await getRiotAdapter().lookupAccountByRiotId({
    gameName: params.gameName,
    tagLine: params.tagLine,
    platformRoute: params.platformRoute,
    regionalRoute: params.regionalRoute
  });

  if (!account?.puuid) {
    throw badRequest("Riot account could not be resolved in the current mode");
  }

  const existing = await prisma.userGameAccount.findFirst({
    where: {
      userId: params.userId,
      provider: ExternalAccountProvider.RIOT,
      game: params.game
    }
  });

  const data = {
    provider: ExternalAccountProvider.RIOT,
    game: params.game,
    riotGameName: account.gameName,
    riotTagLine: account.tagLine,
    externalPlayerId: account.puuid,
    puuid: account.puuid,
    summonerId: account.summonerId,
    platformRoute: account.platformRoute,
    regionalRoute: account.regionalRoute,
    verified: false,
    verificationStatus: env.RIOT_API_MODE === "mock" ? RiotLinkedAccountStatus.MANUAL : RiotLinkedAccountStatus.RSO_PENDING,
    verifiedAt: null,
    lastSyncedAt: new Date(),
    metadata: buildLookupMetadata({ savedAt: new Date().toISOString() })
  };

  if (existing) {
    return prisma.userGameAccount.update({
      where: { id: existing.id },
      data
    });
  }

  return prisma.userGameAccount.create({
    data: {
      userId: params.userId,
      ...data
    }
  });
}

export function getRiotRsoStatus() {
  const config = getRiotRuntimeConfig();

  return {
    enabled: false,
    ready: config.readyForOfficialRso,
    mode: config.mode,
    status: config.readyForOfficialRso ? "CONFIGURED_PENDING_RIOT_APPROVAL" : "PENDING_RIOT_APPROVAL",
    message:
      "Official Riot account ownership verification requires Riot Sign On approval. Lookup-only validation is available for internal testing.",
    requiredEnvironment: ["RIOT_RSO_CLIENT_ID", "RIOT_RSO_CLIENT_SECRET", "RIOT_RSO_REDIRECT_URI"],
    recommendedFlow: "redirect",
    config: {
      rsoClientIdConfigured: config.rsoClientIdConfigured,
      rsoRedirectUriConfigured: config.rsoRedirectUriConfigured,
      readyForOfficialRso: config.readyForOfficialRso
    }
  };
}

export function startRiotRso() {
  const status = getRiotRsoStatus();

  return {
    ...status,
    redirectUrl: null,
    message:
      "Riot Sign On is not active yet. Darkside can validate that a Riot ID exists, but official ownership linking must wait for Riot approval."
  };
}


function getPublicBaseUrl() {
  return env.FRONTEND_URL ?? env.CORS_ALLOWED_ORIGINS[0] ?? "http://localhost:3000";
}

function buildReadinessItem(params: {
  key: string;
  label: string;
  status: "ready" | "pending" | "warning";
  description: string;
  action?: string;
}) {
  return params;
}

export function getRiotRsoCallbackPreview() {
  const config = getRiotRuntimeConfig();
  const publicBaseUrl = getPublicBaseUrl().replace(/\/$/, "");
  const expectedRedirectUri = env.RIOT_RSO_REDIRECT_URI || `${publicBaseUrl}/api/riot/rso/callback`;

  return {
    ok: true,
    mode: config.mode,
    readyForOfficialRso: config.readyForOfficialRso,
    callbackImplemented: false,
    status: config.readyForOfficialRso ? "READY_FOR_RIOT_REVIEW" : "WAITING_FOR_PRODUCTION_KEY_AND_RSO_CLIENT",
    expectedRedirectUri,
    recommendedFlow: "full_page_redirect",
    requiredQueryParams: ["code", "state"],
    securityControls: [
      "state parameter generated server-side",
      "authorization code exchanged only by backend",
      "Riot tokens never exposed to browser storage",
      "ownershipVerified remains false until Riot Sign On succeeds"
    ],
    futureCallbackBehavior: [
      "validate state and current Darkside session",
      "exchange authorization code with Riot OAuth token endpoint",
      "call Riot account endpoint for authenticated player identity",
      "upsert UserGameAccount as RSO_VERIFIED with ownershipVerified=true",
      "audit riot.rso.link_success or riot.rso.link_failure"
    ],
    currentBehavior:
      "This preview does not perform OAuth. It documents the exact callback contract needed for Riot production review."
  };
}

export function getRiotComplianceReadiness() {
  const config = getRiotRuntimeConfig();
  const publicBaseUrl = getPublicBaseUrl().replace(/\/$/, "");
  const legalUrls = {
    terms: `${publicBaseUrl}/legal/terms`,
    privacy: `${publicBaseUrl}/legal/privacy`,
    dataDeletion: `${publicBaseUrl}/legal/data-deletion`
  };

  const items = [
    buildReadinessItem({
      key: "functional_mvp",
      label: "MVP funcional",
      status: "ready",
      description: "Auth, roles, torneos, brackets, matches, disputas, auditoria y paneles admin ya existen.",
      action: "Mantener una demo estable en darkside.cool."
    }),
    buildReadinessItem({
      key: "backend_only_key",
      label: "API key server-side",
      status: config.apiKeyConfigured || config.mode === "mock" ? "ready" : "pending",
      description: "RIOT_API_KEY se consume solo desde apps/api; el frontend usa endpoints internos.",
      action: config.apiKeyConfigured ? "OK" : "Configurar RIOT_API_KEY en Render API, no en Web."
    }),
    buildReadinessItem({
      key: "lookup_vs_ownership",
      label: "Lookup separado de ownership",
      status: "ready",
      description: "Darkside diferencia validacion tecnica LOOKUP_ONLY de vinculacion oficial por Riot Sign On.",
      action: "Conservar mensajes de RSO pendiente hasta aprobacion Riot."
    }),
    buildReadinessItem({
      key: "rso_credentials",
      label: "Credenciales RSO",
      status: config.readyForOfficialRso ? "ready" : "pending",
      description: "RSO requiere RIOT_RSO_CLIENT_ID, RIOT_RSO_CLIENT_SECRET y RIOT_RSO_REDIRECT_URI aprobados.",
      action: config.readyForOfficialRso ? "Validar callback real con Riot." : "Solicitar Production Key y RSO client a Riot."
    }),
    buildReadinessItem({
      key: "rso_callback_contract",
      label: "Contrato de callback RSO",
      status: env.RIOT_RSO_REDIRECT_URI ? "ready" : "warning",
      description: `Redirect URI objetivo: ${env.RIOT_RSO_REDIRECT_URI || `${publicBaseUrl}/api/riot/rso/callback`}`,
      action: "Registrar exactamente el mismo redirect URI en Riot Developer Portal cuando se apruebe RSO."
    }),
    buildReadinessItem({
      key: "legal_terms",
      label: "Terminos visibles",
      status: "ready",
      description: `Terminos publicados en ${legalUrls.terms}.`,
      action: "Revisar que incluyan tokens no monetarios y no gambling."
    }),
    buildReadinessItem({
      key: "privacy_policy",
      label: "Privacidad y datos Riot",
      status: "ready",
      description: `Politica publicada en ${legalUrls.privacy}.`,
      action: "Mantener detalle de datos Riot usados: Riot ID, PUUID, ranking e historial competitivo."
    }),
    buildReadinessItem({
      key: "data_deletion",
      label: "Eliminacion de datos",
      status: "ready",
      description: `Politica de eliminacion publicada en ${legalUrls.dataDeletion}.`,
      action: "Asegurar que solicitudes de borrado puedan eliminar/desvincular cuentas Riot."
    }),
    buildReadinessItem({
      key: "riot_disclaimer",
      label: "Disclaimer Riot",
      status: "ready",
      description: "La plataforma debe indicar que no esta afiliada, patrocinada ni respaldada por Riot Games.",
      action: "Agregar este disclaimer en docs y superficies publicas relevantes."
    }),
    buildReadinessItem({
      key: "no_gambling",
      label: "No gambling / tokens internos",
      status: "ready",
      description: "DS_TOKEN es interno, no retirable y no convertible a dinero real.",
      action: "Mantenerlo claro en terminos y UI de tokens."
    }),
    buildReadinessItem({
      key: "riot_capabilities",
      label: "Compatibilidad API validada",
      status: "ready",
      description: "Account-V1, Summoner-V4, League-V4 por PUUID y Match-V5 fueron probados con endpoint admin.",
      action: "Usar /api/riot/capabilities/check para evidencias de demo."
    }),
    buildReadinessItem({
      key: "tournament_codes",
      label: "Tournament Codes",
      status: config.readyForTournamentCodes ? "ready" : "pending",
      description: "Tournament Codes requieren provider, callback URL, secreto y aprobacion Riot.",
      action: "Mantener simulacion/manual hasta aprobacion."
    })
  ];

  const summary = items.reduce(
    (acc, item) => {
      acc.total += 1;
      acc[item.status] += 1;
      return acc;
    },
    { total: 0, ready: 0, pending: 0, warning: 0 }
  );

  return {
    ok: true,
    mode: config.mode,
    status: summary.pending === 0 ? "READY_FOR_RIOT_REVIEW" : "PREPARING_RIOT_REVIEW",
    publicBaseUrl,
    legalUrls,
    rso: getRiotRsoStatus(),
    callbackPreview: getRiotRsoCallbackPreview(),
    summary,
    items,
    nextActions: [
      "Mantener deploy estable en darkside.cool.",
      "Verificar dominio cuando Riot solicite site verification.",
      "Preparar solicitud Production Key describiendo torneos universitarios, no gambling y moderacion.",
      "Solicitar RSO para ownership verification antes de torneos oficiales.",
      "No activar Tournament Codes reales hasta tener provider/callback aprobado."
    ]
  };
}

export async function unlinkRiotAccount(params: { userId: string; accountId: string }) {
  const existing = await prisma.userGameAccount.findFirst({
    where: {
      id: params.accountId,
      userId: params.userId,
      provider: ExternalAccountProvider.RIOT
    }
  });

  if (!existing) {
    throw badRequest("Riot account link not found");
  }

  await prisma.userGameAccount.delete({
    where: { id: existing.id }
  });

  return { id: existing.id, unlinked: true };
}

export async function testRiotConnection(params?: { gameName?: string; tagLine?: string; userId?: string }) {
  const config = getRiotRuntimeConfig();

  if (config.mode === "mock") {
    return {
      ok: true,
      skippedExternalRequest: true,
      message: "RIOT_API_MODE=mock. No external Riot request was made.",
      config
    };
  }

  if (!params?.gameName || !params?.tagLine) {
    return {
      ok: false,
      skippedExternalRequest: true,
      message: "Provide a Riot ID and tagline to run a safe backend-only test request.",
      config
    };
  }

  const account = await riotRequest<{ puuid: string; gameName: string; tagLine: string }>({
    route: "regional",
    path: `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(params.gameName)}/${encodeURIComponent(params.tagLine)}`,
    userId: params.userId,
    metadata: { operation: "adminTestConnection" }
  });

  return {
    ok: true,
    skippedExternalRequest: false,
    account: {
      gameName: account.gameName,
      tagLine: account.tagLine,
      puuidPresent: Boolean(account.puuid)
    },
    config
  };
}

export async function checkRiotCapabilities(params: {
  gameName: string;
  tagLine: string;
  platformRoute: string;
  regionalRoute: string;
  userId?: string;
}) {
  const config = getRiotRuntimeConfig();

  if (config.mode === "mock") {
    return {
      ok: true,
      mode: config.mode,
      message: "RIOT_API_MODE=mock. Capability checks are simulated and no Riot request was made.",
      accountV1: { status: "ok", data: { gameName: params.gameName, tagLine: params.tagLine, puuidPresent: true } },
      summonerV4: { status: "ok", data: { profileIconId: 654, summonerLevel: 247 } },
      leagueV4: { status: "ok", data: { queues: [{ queueType: "RANKED_SOLO_5x5", label: "SoloQ", tier: "GOLD", rank: "II", leaguePoints: 63, wins: 179, losses: 145, winRate: 55 }] } },
      matchV5: { status: "ok", data: { recentMatches: 5, sampleMatchIds: ["LA1_MOCK_1", "LA1_MOCK_2"] } },
      matchDetailV5: { status: "ok", data: { matchId: "LA1_MOCK_1", championName: "Rumble", result: "loss", kills: 2, deaths: 11, assists: 8, kda: 0.91 } },
      rso: { status: "not_configured", message: "Official ownership verification requires Riot Sign On approval." },
      tournamentCodes: { status: config.readyForTournamentCodes ? "ok" : "not_configured", message: "Tournament Codes require provider/callback configuration and Riot approval." }
    };
  }

  if (!config.readyForAccountLookup) {
    return {
      ok: false,
      mode: config.mode,
      message: "Riot API key is not configured. Account lookup cannot run.",
      accountV1: { status: "not_configured", message: "RIOT_API_KEY is required." }
    };
  }

  const context = {
    userId: params.userId,
    metadata: { operation: "capabilitiesCheck", gameName: params.gameName, tagLine: params.tagLine }
  };

  const response: Record<string, unknown> = {
    ok: true,
    mode: config.mode,
    requestedRiotId: `${params.gameName}#${params.tagLine}`,
    platformRoute: params.platformRoute,
    regionalRoute: params.regionalRoute,
    rso: {
      status: config.readyForOfficialRso ? "ok" : "not_configured",
      message: config.readyForOfficialRso
        ? "RSO environment variables are configured, but Riot approval is still required before official linking."
        : "Official Riot account ownership verification requires Riot Sign On approval and RSO credentials."
    },
    tournamentCodes: {
      status: config.readyForTournamentCodes ? "ok" : "not_configured",
      message: config.readyForTournamentCodes
        ? "Tournament Code prerequisites are configured. Use only after Riot approval and callback validation."
        : "Tournament Codes require RIOT_TOURNAMENT_API_ENABLED, provider id, callback URL and Riot approval."
    }
  };

  let puuid = "";

  try {
    const account = await riotRequest<RiotAccountDto>({
      route: "regional",
      path: `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(params.gameName)}/${encodeURIComponent(params.tagLine)}`,
      retries: 0,
      ...context
    });

    puuid = account.puuid;
    response.accountV1 = {
      status: "ok",
      data: {
        gameName: account.gameName,
        tagLine: account.tagLine,
        puuidPresent: Boolean(account.puuid)
      }
    } satisfies CapabilityResult;
  } catch (error) {
    response.ok = false;
    response.accountV1 = capabilityError(error);
    response.summonerV4 = { status: "skipped", message: "Account lookup failed." };
    response.leagueV4 = { status: "skipped", message: "Account lookup failed." };
    response.matchV5 = { status: "skipped", message: "Account lookup failed." };
    response.matchDetailV5 = { status: "skipped", message: "Account lookup failed." };
    return response;
  }

  try {
    const summoner = await riotRequest<RiotSummonerDto>({
      route: "platform",
      path: `/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`,
      retries: 0,
      ...context
    });

    response.summonerV4 = {
      status: "ok",
      data: {
        profileIconId: summoner.profileIconId ?? null,
        summonerLevel: summoner.summonerLevel ?? null,
        revisionDate: summoner.revisionDate ?? null,
        summonerIdPresent: Boolean(summoner.id),
        puuidPresent: Boolean(summoner.puuid)
      }
    } satisfies CapabilityResult;
  } catch (error) {
    response.summonerV4 = capabilityError(error);
  }

  try {
    const leagueEntries = await riotRequest<RiotLeagueEntryDto[]>({
      route: "platform",
      path: `/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`,
      retries: 0,
      ...context
    });

    const queues = leagueEntries.map((entry) => {
      const totalGames = entry.wins + entry.losses;
      return {
        queueType: entry.queueType,
        label: queueLabel(entry.queueType),
        tier: entry.tier,
        rank: entry.rank,
        leaguePoints: entry.leaguePoints,
        wins: entry.wins,
        losses: entry.losses,
        winRate: totalGames ? Math.round((entry.wins / totalGames) * 100) : 0,
        hotStreak: Boolean(entry.hotStreak),
        inactive: Boolean(entry.inactive)
      };
    });

    response.leagueV4 = {
      status: queues.length ? "ok" : "empty",
      data: { queues }
    } satisfies CapabilityResult;
  } catch (error) {
    response.leagueV4 = capabilityError(error);
  }

  let matchIds: string[] = [];

  try {
    matchIds = await riotRequest<string[]>({
      route: "regional",
      path: `/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=0&count=5`,
      retries: 0,
      ...context
    });

    response.matchV5 = {
      status: matchIds.length ? "ok" : "empty",
      data: {
        recentMatches: matchIds.length,
        sampleMatchIds: matchIds
      }
    } satisfies CapabilityResult;
  } catch (error) {
    response.matchV5 = capabilityError(error);
  }

  const firstMatchId = matchIds[0];

  if (!firstMatchId) {
    response.matchDetailV5 = { status: "skipped", message: "No recent match id was available." };
    return response;
  }

  try {
    const match = await riotRequest<RiotMatchDto>({
      route: "regional",
      path: `/lol/match/v5/matches/${encodeURIComponent(firstMatchId)}`,
      retries: 0,
      ...context
    });

    const participant = match.info?.participants?.find((item) => item.puuid === puuid);
    const deaths = participant?.deaths ?? 0;
    const kda = deaths > 0 ? Number((((participant?.kills ?? 0) + (participant?.assists ?? 0)) / deaths).toFixed(2)) : (participant?.kills ?? 0) + (participant?.assists ?? 0);

    response.matchDetailV5 = {
      status: participant ? "ok" : "empty",
      data: {
        matchId: match.metadata?.matchId ?? firstMatchId,
        gameMode: match.info?.gameMode ?? null,
        gameType: match.info?.gameType ?? null,
        durationSeconds: match.info?.gameDuration ?? null,
        championName: participant?.championName ?? null,
        championId: participant?.championId ?? null,
        position: participant?.teamPosition || participant?.individualPosition || null,
        result: participant?.win ? "win" : "loss",
        kills: participant?.kills ?? null,
        deaths: participant?.deaths ?? null,
        assists: participant?.assists ?? null,
        kda
      }
    } satisfies CapabilityResult;
  } catch (error) {
    response.matchDetailV5 = capabilityError(error);
  }

  return response;
}


function buildQueueSummary(entries: RiotLeagueEntryDto[]) {
  return entries.map((entry) => {
    const totalGames = entry.wins + entry.losses;
    return {
      queueType: entry.queueType,
      label: queueLabel(entry.queueType),
      tier: entry.tier,
      rank: entry.rank,
      leaguePoints: entry.leaguePoints,
      wins: entry.wins,
      losses: entry.losses,
      winRate: totalGames ? Math.round((entry.wins / totalGames) * 100) : 0,
      hotStreak: Boolean(entry.hotStreak),
      inactive: Boolean(entry.inactive)
    };
  });
}

function summarizeMatch(match: RiotMatchDto, matchId: string, puuid: string) {
  const participant = match.info?.participants?.find((item) => item.puuid === puuid);
  const deaths = participant?.deaths ?? 0;
  const kda = deaths > 0
    ? Number((((participant?.kills ?? 0) + (participant?.assists ?? 0)) / deaths).toFixed(2))
    : (participant?.kills ?? 0) + (participant?.assists ?? 0);

  return {
    matchId: match.metadata?.matchId ?? matchId,
    gameMode: match.info?.gameMode ?? null,
    gameType: match.info?.gameType ?? null,
    durationSeconds: match.info?.gameDuration ?? null,
    endedAt: match.info?.gameEndTimestamp ? new Date(match.info.gameEndTimestamp).toISOString() : null,
    championName: participant?.championName ?? null,
    championId: participant?.championId ?? null,
    position: participant?.teamPosition || participant?.individualPosition || null,
    result: participant?.win ? "win" : "loss",
    kills: participant?.kills ?? null,
    deaths: participant?.deaths ?? null,
    assists: participant?.assists ?? null,
    kda
  };
}

async function loadRiotCompetitiveData(params: { puuid: string; userId: string; metadataOperation: string }) {
  const context = {
    userId: params.userId,
    metadata: { operation: params.metadataOperation }
  };

  const summary: Record<string, unknown> = {
    summoner: { status: "skipped" },
    ranked: { status: "skipped", queues: [] },
    recentMatches: { status: "skipped", matches: [] }
  };

  try {
    const summoner = await riotRequest<RiotSummonerDto>({
      route: "platform",
      path: `/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(params.puuid)}`,
      retries: 0,
      ...context
    });

    summary.summoner = {
      status: "ok",
      profileIconId: summoner.profileIconId ?? null,
      summonerLevel: summoner.summonerLevel ?? null,
      revisionDate: summoner.revisionDate ?? null
    };
  } catch (error) {
    summary.summoner = capabilityError(error);
  }

  try {
    const entries = await riotRequest<RiotLeagueEntryDto[]>({
      route: "platform",
      path: `/lol/league/v4/entries/by-puuid/${encodeURIComponent(params.puuid)}`,
      retries: 0,
      ...context
    });

    const queues = buildQueueSummary(entries);
    summary.ranked = {
      status: queues.length ? "ok" : "empty",
      queues
    };
  } catch (error) {
    summary.ranked = capabilityError(error);
  }

  try {
    const matchIds = await riotRequest<string[]>({
      route: "regional",
      path: `/lol/match/v5/matches/by-puuid/${encodeURIComponent(params.puuid)}/ids?start=0&count=5`,
      retries: 0,
      ...context
    });

    const details = await Promise.all(
      matchIds.slice(0, 5).map(async (matchId) => {
        try {
          const match = await riotRequest<RiotMatchDto>({
            route: "regional",
            path: `/lol/match/v5/matches/${encodeURIComponent(matchId)}`,
            retries: 0,
            ...context
          });

          return summarizeMatch(match, matchId, params.puuid);
        } catch {
          return null;
        }
      })
    );

    summary.recentMatches = {
      status: matchIds.length ? "ok" : "empty",
      sampleMatchIds: matchIds,
      matches: details.filter(Boolean)
    };
  } catch (error) {
    summary.recentMatches = capabilityError(error);
  }

  return summary;
}

export async function getMyRiotCompetitiveSummary(userId: string) {
  const config = getRiotRuntimeConfig();
  const account = await prisma.userGameAccount.findFirst({
    where: {
      userId,
      provider: ExternalAccountProvider.RIOT
    },
    orderBy: { updatedAt: "desc" }
  });

  if (!account) {
    return {
      ok: false,
      mode: config.mode,
      message: "No Riot ID has been saved for this Darkside profile yet.",
      account: null,
      summoner: { status: "skipped" },
      ranked: { status: "skipped", queues: [] },
      recentMatches: { status: "skipped", matches: [] }
    };
  }

  const accountSummary = {
    id: account.id,
    game: account.game,
    gameName: account.riotGameName,
    tagLine: account.riotTagLine,
    platformRoute: account.platformRoute,
    regionalRoute: account.regionalRoute,
    verified: account.verified,
    verificationStatus: account.verificationStatus,
    ownershipVerified: Boolean((account.metadata as Record<string, unknown> | null)?.ownershipVerified),
    puuidPresent: Boolean(account.puuid),
    lastSyncedAt: account.lastSyncedAt
  };

  if (!account.puuid) {
    return {
      ok: false,
      mode: config.mode,
      message: "Saved Riot account does not have PUUID metadata yet. Re-run technical validation.",
      account: accountSummary,
      summoner: { status: "skipped" },
      ranked: { status: "skipped", queues: [] },
      recentMatches: { status: "skipped", matches: [] }
    };
  }

  if (config.mode === "mock") {
    return {
      ok: true,
      mode: config.mode,
      account: accountSummary,
      summoner: { status: "ok", profileIconId: 654, summonerLevel: 247, revisionDate: Date.now() },
      ranked: {
        status: "ok",
        queues: [
          { queueType: "RANKED_SOLO_5x5", label: "SoloQ", tier: "GOLD", rank: "II", leaguePoints: 63, wins: 179, losses: 145, winRate: 55 },
          { queueType: "RANKED_FLEX_SR", label: "Flex", tier: "SILVER", rank: "I", leaguePoints: 32, wins: 10, losses: 7, winRate: 59 }
        ]
      },
      recentMatches: {
        status: "ok",
        matches: [
          { matchId: "LA1_MOCK_1", championName: "Rumble", result: "loss", kills: 2, deaths: 11, assists: 8, kda: 0.91, position: "TOP", durationSeconds: 1789 },
          { matchId: "LA1_MOCK_2", championName: "Ashe", result: "win", kills: 9, deaths: 4, assists: 12, kda: 5.25, position: "BOTTOM", durationSeconds: 1650 }
        ]
      }
    };
  }

  if (!config.readyForAccountLookup) {
    return {
      ok: false,
      mode: config.mode,
      message: "Riot API is not configured for real competitive data.",
      account: accountSummary,
      summoner: { status: "not_configured" },
      ranked: { status: "not_configured", queues: [] },
      recentMatches: { status: "not_configured", matches: [] }
    };
  }

  const competitive = await loadRiotCompetitiveData({
    puuid: account.puuid,
    userId,
    metadataOperation: "competitiveSummary"
  });

  return {
    ok: true,
    mode: config.mode,
    account: accountSummary,
    ...competitive
  };
}

export async function getRiotAdminOverview() {
  const [totalRequests, successfulRequests, recentLogs, recentErrors, codeCount, callbackCount, pendingCallbacks] =
    await Promise.all([
      prisma.riotApiLog.count(),
      prisma.riotApiLog.count({ where: { success: true } }),
      prisma.riotApiLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 20
      }),
      prisma.riotApiLog.findMany({
        where: { success: false },
        orderBy: { createdAt: "desc" },
        take: 20
      }),
      prisma.riotTournamentCode.count(),
      prisma.riotCallbackEvent.count(),
      prisma.riotCallbackEvent.count({ where: { status: "RECEIVED" } })
    ]);

  const errorsByType = await prisma.riotApiLog.groupBy({
    by: ["errorType"],
    where: {
      success: false,
      errorType: {
        not: null
      }
    },
    _count: {
      _all: true
    },
    orderBy: {
      _count: {
        errorType: "desc"
      }
    },
    take: 10
  });

  return {
    config: getRiotRuntimeConfig(),
    metrics: {
      totalRequests,
      successfulRequests,
      successRate: totalRequests ? Math.round((successfulRequests / totalRequests) * 100) : 0,
      codeCount,
      callbackCount,
      pendingCallbacks
    },
    errorsByType: errorsByType.map((item) => ({
      errorType: item.errorType,
      count: item._count._all
    })),
    recentLogs,
    recentErrors
  };
}

export async function getMyRiotAccounts(userId: string) {
  return prisma.userGameAccount.findMany({
    where: {
      userId,
      provider: ExternalAccountProvider.RIOT
    },
    orderBy: { updatedAt: "desc" }
  });
}
