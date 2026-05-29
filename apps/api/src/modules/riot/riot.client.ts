import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { HttpError } from "../../utils/http-error.js";

type RiotRoute = "platform" | "regional";
type RiotMethod = "GET" | "POST" | "PUT" | "DELETE";

type RiotRequestContext = {
  userId?: string;
  tournamentId?: string;
  matchId?: string;
  metadata?: Record<string, unknown>;
};

type RiotRequestOptions = RiotRequestContext & {
  route: RiotRoute;
  method?: RiotMethod;
  path: string;
  body?: unknown;
  retries?: number;
};

export class RiotApiError extends HttpError {
  riotStatusCode?: number;
  retryAfter?: number;
  errorType?: string;

  constructor(message: string, params: { riotStatusCode?: number; retryAfter?: number; errorType?: string }) {
    super(resolvePublicStatus(params.riotStatusCode), message);
    this.name = "RiotApiError";
    this.riotStatusCode = params.riotStatusCode;
    this.retryAfter = params.retryAfter;
    this.errorType = params.errorType;
  }
}

function resolvePublicStatus(statusCode?: number) {
  if (statusCode === 404) {
    return 404;
  }

  if (statusCode === 401 || statusCode === 403) {
    return 502;
  }

  if (statusCode === 429) {
    return 429;
  }

  if (statusCode && statusCode >= 500) {
    return 503;
  }

  return 502;
}

function normalizeRoute(value: string) {
  return value.trim().toLowerCase();
}

function riotBaseUrl(route: RiotRoute) {
  const region = route === "platform" ? env.RIOT_REGION : env.RIOT_REGIONAL_ROUTE;
  return `https://${normalizeRoute(region)}.api.riotgames.com`;
}

function parseRetryAfter(value: string | null) {
  if (!value) {
    return undefined;
  }

  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : undefined;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function classifyError(statusCode?: number, fallback = "RIOT_API_ERROR") {
  if (!statusCode) {
    return fallback;
  }

  if (statusCode === 401 || statusCode === 403) {
    return "RIOT_AUTH_ERROR";
  }

  if (statusCode === 404) {
    return "RIOT_NOT_FOUND";
  }

  if (statusCode === 415) {
    return "RIOT_UNSUPPORTED_MEDIA_TYPE";
  }

  if (statusCode === 429) {
    return "RIOT_RATE_LIMIT";
  }

  if (statusCode >= 500) {
    return "RIOT_UPSTREAM_ERROR";
  }

  return "RIOT_REQUEST_ERROR";
}

async function readResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : {};
}

async function recordRiotApiLog(input: {
  endpoint: string;
  method: string;
  route: RiotRoute;
  statusCode?: number;
  durationMs: number;
  success: boolean;
  errorType?: string;
  errorMessage?: string;
  retryAfter?: number;
  context?: RiotRequestContext;
}) {
  try {
    await prisma.riotApiLog.create({
      data: {
        endpoint: input.endpoint,
        method: input.method,
        region: input.route === "regional" ? normalizeRoute(env.RIOT_REGIONAL_ROUTE) : normalizeRoute(env.RIOT_REGION),
        platformRoute: normalizeRoute(env.RIOT_REGION),
        statusCode: input.statusCode,
        durationMs: input.durationMs,
        success: input.success,
        errorType: input.errorType,
        errorMessage: input.errorMessage?.slice(0, 500),
        retryAfter: input.retryAfter,
        userId: input.context?.userId,
        tournamentId: input.context?.tournamentId,
        matchId: input.context?.matchId,
        metadata: input.context?.metadata as Prisma.InputJsonValue | undefined
      }
    });
  } catch {
    // Logging must never break the user-facing Riot flow.
  }
}

export function getRiotRuntimeConfig() {
  const providerId = env.RIOT_TOURNAMENT_PROVIDER_ID ?? env.RIOT_PROVIDER_ID;
  const apiKeyConfigured = Boolean(env.RIOT_API_KEY);
  const callbackUrlConfigured = Boolean(env.RIOT_CALLBACK_URL);
  const tournamentProviderIdConfigured = Boolean(providerId);
  const rsoClientIdConfigured = Boolean(env.RIOT_RSO_CLIENT_ID);
  const rsoClientSecretConfigured = Boolean(env.RIOT_RSO_CLIENT_SECRET);
  const rsoRedirectUriConfigured = Boolean(env.RIOT_RSO_REDIRECT_URI);
  const readyForAccountLookup = env.RIOT_API_MODE === "mock" || apiKeyConfigured;
  const readyForTournamentCodes =
    env.RIOT_TOURNAMENT_API_ENABLED && apiKeyConfigured && callbackUrlConfigured && tournamentProviderIdConfigured;
  const readyForOfficialRso = rsoClientIdConfigured && rsoClientSecretConfigured && rsoRedirectUriConfigured;
  const missingRequirements = [
    ...(readyForAccountLookup ? [] : ["RIOT_API_KEY"]),
    ...(readyForOfficialRso ? [] : ["RIOT_RSO_CLIENT_ID", "RIOT_RSO_CLIENT_SECRET", "RIOT_RSO_REDIRECT_URI"]),
    ...(readyForTournamentCodes ? [] : ["RIOT_CALLBACK_URL", "RIOT_TOURNAMENT_PROVIDER_ID"])
  ];

  return {
    mode: env.RIOT_API_MODE,
    apiKeyConfigured,
    region: normalizeRoute(env.RIOT_REGION),
    regionalRoute: normalizeRoute(env.RIOT_REGIONAL_ROUTE),
    callbackUrlConfigured,
    tournamentProviderIdConfigured,
    tournamentApiEnabled: env.RIOT_TOURNAMENT_API_ENABLED,
    readyForAccountLookup,
    readyForTournamentCodes,
    rsoClientIdConfigured,
    rsoRedirectUriConfigured,
    readyForOfficialRso,
    realRequestsEnabled: env.RIOT_API_MODE !== "mock" && apiKeyConfigured,
    missingRequirements: Array.from(new Set(missingRequirements))
  };
}

export async function riotRequest<T>(options: RiotRequestOptions): Promise<T> {
  if (!env.RIOT_API_KEY) {
    throw new RiotApiError("Riot API key is not configured on the backend.", {
      errorType: "RIOT_API_KEY_MISSING"
    });
  }

  const method = options.method ?? "GET";
  const baseUrl = riotBaseUrl(options.route);
  const url = `${baseUrl}${options.path}`;
  const maxRetries = options.retries ?? 1;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const startedAt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.RIOT_API_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method,
        signal: controller.signal,
        headers: {
          "X-Riot-Token": env.RIOT_API_KEY,
          ...(options.body ? { "Content-Type": "application/json" } : {})
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      const durationMs = Date.now() - startedAt;
      const retryAfter = parseRetryAfter(response.headers.get("retry-after"));
      const payload = await readResponse(response);

      await recordRiotApiLog({
        endpoint: options.path,
        method,
        route: options.route,
        statusCode: response.status,
        durationMs,
        success: response.ok,
        errorType: response.ok ? undefined : classifyError(response.status),
        errorMessage: response.ok ? undefined : JSON.stringify(payload),
        retryAfter,
        context: options
      });

      if (response.ok) {
        return payload as T;
      }

      if (response.status === 429 && retryAfter && attempt < maxRetries) {
        await sleep(Math.min(retryAfter * 1000, 30_000));
        continue;
      }

      throw new RiotApiError("Riot API request failed safely. Review admin Riot logs for details.", {
        riotStatusCode: response.status,
        retryAfter,
        errorType: classifyError(response.status)
      });
    } catch (error) {
      const durationMs = Date.now() - startedAt;

      if (error instanceof RiotApiError) {
        throw error;
      }

      const errorType = error instanceof Error && error.name === "AbortError" ? "RIOT_TIMEOUT" : "RIOT_NETWORK_ERROR";

      await recordRiotApiLog({
        endpoint: options.path,
        method,
        route: options.route,
        durationMs,
        success: false,
        errorType,
        errorMessage: error instanceof Error ? error.message : "Unknown Riot client error",
        context: options
      });

      if (attempt < maxRetries) {
        await sleep(Math.min(1000 * (attempt + 1), 5000));
        continue;
      }

      throw new RiotApiError("Riot API is temporarily unavailable. Try again later.", {
        errorType
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new RiotApiError("Riot API request failed after retries.", {
    errorType: "RIOT_RETRY_EXHAUSTED"
  });
}
