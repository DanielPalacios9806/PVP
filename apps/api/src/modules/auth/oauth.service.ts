import bcrypt from "bcryptjs";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { OAuthProvider, UserRole, UserStatus, WalletType } from "@prisma/client";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { badRequest, conflict, unauthorized } from "../../utils/http-error.js";
import { createAuditLog } from "../audit/audit.service.js";
import { createAuthSession } from "./auth.service.js";

type ProviderKey = "google" | "facebook";

type OAuthProfile = {
  provider: OAuthProvider;
  providerUserId: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  avatarUrl?: string;
  metadata: Record<string, unknown>;
};

type OAuthProviderConfig = {
  provider: OAuthProvider;
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  clientId?: string;
  clientSecret?: string;
  callbackUrl?: string;
  scopes: string[];
};

const providerConfigs: Record<ProviderKey, OAuthProviderConfig> = {
  google: {
    provider: OAuthProvider.GOOGLE,
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    callbackUrl: env.GOOGLE_CALLBACK_URL,
    scopes: ["openid", "email", "profile"]
  },
  facebook: {
    provider: OAuthProvider.FACEBOOK,
    authUrl: "https://www.facebook.com/v20.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v20.0/oauth/access_token",
    userInfoUrl: "https://graph.facebook.com/me",
    clientId: env.FACEBOOK_CLIENT_ID,
    clientSecret: env.FACEBOOK_CLIENT_SECRET,
    callbackUrl: env.FACEBOOK_CALLBACK_URL,
    scopes: ["email", "public_profile"]
  }
};

function getOAuthSecret() {
  return env.OAUTH_STATE_SECRET || env.JWT_SECRET;
}

function encodeJson(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeJson<T>(value: string): T {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

function signStatePayload(payload: string) {
  return createHmac("sha256", getOAuthSecret()).update(payload).digest("base64url");
}

function createOAuthState(provider: ProviderKey) {
  const payload = encodeJson({
    provider,
    nonce: randomBytes(16).toString("hex"),
    iat: Date.now()
  });
  const signature = signStatePayload(payload);
  return `${payload}.${signature}`;
}

function verifyOAuthState(state: string, expectedProvider: ProviderKey) {
  const [payload, signature] = state.split(".");
  if (!payload || !signature) {
    throw unauthorized("Invalid OAuth state");
  }

  const expectedSignature = signStatePayload(payload);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw unauthorized("Invalid OAuth state");
  }

  const decoded = decodeJson<{ provider: ProviderKey; iat: number }>(payload);
  const stateAgeMs = Date.now() - decoded.iat;

  if (decoded.provider !== expectedProvider || stateAgeMs > 10 * 60 * 1000) {
    throw unauthorized("Expired OAuth state");
  }

  return decoded;
}

function requireProvider(provider: ProviderKey) {
  const config = providerConfigs[provider];
  if (!config.clientId || !config.clientSecret || !config.callbackUrl) {
    throw badRequest(`${provider} OAuth is not configured`);
  }

  return config as OAuthProviderConfig & {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  };
}

async function fetchJson<T>(url: string, init: RequestInit, context: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal
    });
    const text = await response.text();
    const body = text ? (JSON.parse(text) as T & { error?: string; error_description?: string }) : ({} as T);

    if (!response.ok) {
      throw badRequest(`${context} failed with status ${response.status}`);
    }

    return body;
  } finally {
    clearTimeout(timeout);
  }
}

async function exchangeCode(provider: ProviderKey, code: string) {
  const config = requireProvider(provider);

  if (provider === "google") {
    return fetchJson<{ access_token?: string; id_token?: string }>(
      config.tokenUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: config.callbackUrl
        })
      },
      "Google token exchange"
    );
  }

  const url = new URL(config.tokenUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("client_secret", config.clientSecret);
  url.searchParams.set("redirect_uri", config.callbackUrl);
  url.searchParams.set("code", code);

  return fetchJson<{ access_token?: string }>(url.toString(), { method: "GET" }, "Facebook token exchange");
}

async function getProviderProfile(provider: ProviderKey, accessToken: string): Promise<OAuthProfile> {
  const config = requireProvider(provider);

  if (provider === "google") {
    const profile = await fetchJson<{
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    }>(
      config.userInfoUrl,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      },
      "Google profile lookup"
    );

    return {
      provider: OAuthProvider.GOOGLE,
      providerUserId: profile.sub ?? "",
      email: profile.email ?? "",
      emailVerified: Boolean(profile.email_verified),
      displayName: profile.name,
      avatarUrl: profile.picture,
      metadata: profile
    };
  }

  const url = new URL(config.userInfoUrl);
  url.searchParams.set("fields", "id,name,email,picture");
  url.searchParams.set("access_token", accessToken);
  const profile = await fetchJson<{
    id?: string;
    email?: string;
    name?: string;
    picture?: {
      data?: {
        url?: string;
      };
    };
  }>(url.toString(), { method: "GET" }, "Facebook profile lookup");

  return {
    provider: OAuthProvider.FACEBOOK,
    providerUserId: profile.id ?? "",
    email: profile.email ?? "",
    emailVerified: Boolean(profile.email),
    displayName: profile.name,
    avatarUrl: profile.picture?.data?.url,
    metadata: profile
  };
}

function normalizeUsername(seed: string) {
  const base = seed
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 18);

  return base || `player${randomBytes(3).toString("hex")}`;
}

async function createUniqueUsername(email: string) {
  const base = normalizeUsername(email.split("@")[0] ?? "player");
  let username = base;
  let index = 0;

  while (await prisma.user.findUnique({ where: { username }, select: { id: true } })) {
    index += 1;
    username = `${base}${index}`.slice(0, 24);
  }

  return username;
}

export function getOAuthProviders() {
  return {
    google: Boolean(providerConfigs.google.clientId && providerConfigs.google.clientSecret && providerConfigs.google.callbackUrl),
    facebook: Boolean(
      providerConfigs.facebook.clientId &&
        providerConfigs.facebook.clientSecret &&
        providerConfigs.facebook.callbackUrl
    )
  };
}

export async function createOAuthRedirectUrl(provider: ProviderKey, ipAddress?: string | null) {
  const config = requireProvider(provider);
  const state = createOAuthState(provider);
  const url = new URL(config.authUrl);

  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.callbackUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scopes.join(" "));
  url.searchParams.set("state", state);

  if (provider === "google") {
    url.searchParams.set("access_type", "online");
    url.searchParams.set("prompt", "select_account");
  }

  await createAuditLog({
    action: "auth.oauth.start",
    entityType: "oauth",
    metadata: { provider },
    ipAddress
  });

  return url.toString();
}

export async function completeOAuthLogin(input: {
  provider: ProviderKey;
  code: string;
  state: string;
  ipAddress?: string | null;
}) {
  verifyOAuthState(input.state, input.provider);
  const token = await exchangeCode(input.provider, input.code);

  if (!token.access_token) {
    throw badRequest("OAuth provider did not return an access token");
  }

  const profile = await getProviderProfile(input.provider, token.access_token);

  if (!profile.providerUserId || !profile.email || !profile.emailVerified) {
    await createAuditLog({
      action: "auth.oauth.reject",
      entityType: "oauth",
      metadata: {
        provider: profile.provider,
        reason: "missing_verified_email"
      },
      ipAddress: input.ipAddress
    });
    throw unauthorized("OAuth account must include a verified email");
  }

  const existingOAuth = await prisma.userOAuthAccount.findUnique({
    where: {
      provider_providerUserId: {
        provider: profile.provider,
        providerUserId: profile.providerUserId
      }
    },
    include: {
      user: {
        include: {
          wallets: true
        }
      }
    }
  });

  if (existingOAuth) {
    if (existingOAuth.user.status !== UserStatus.ACTIVE) {
      throw unauthorized("Account is not active");
    }

    await prisma.userOAuthAccount.update({
      where: { id: existingOAuth.id },
      data: {
        email: profile.email,
        emailVerified: profile.emailVerified,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        metadata: profile.metadata as never
      }
    });

    await createAuditLog({
      actorUserId: existingOAuth.userId,
      action: "auth.oauth.login",
      entityType: "user",
      entityId: existingOAuth.userId,
      metadata: { provider: profile.provider, email: profile.email },
      ipAddress: input.ipAddress
    });

    return createAuthSession(existingOAuth.user);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: profile.email },
    include: {
      wallets: true,
      oauthAccounts: true
    }
  });

  if (existingUser) {
    if (existingUser.status !== UserStatus.ACTIVE) {
      throw unauthorized("Account is not active");
    }

    if (existingUser.oauthAccounts.some((account) => account.provider === profile.provider)) {
      throw conflict("This user already has an account connected for this provider");
    }

    await prisma.userOAuthAccount.create({
      data: {
        userId: existingUser.id,
        provider: profile.provider,
        providerUserId: profile.providerUserId,
        email: profile.email,
        emailVerified: profile.emailVerified,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        metadata: profile.metadata as never
      }
    });

    await createAuditLog({
      actorUserId: existingUser.id,
      action: "auth.oauth.link",
      entityType: "user",
      entityId: existingUser.id,
      metadata: { provider: profile.provider, email: profile.email },
      ipAddress: input.ipAddress
    });

    return createAuthSession(existingUser);
  }

  const username = await createUniqueUsername(profile.email);
  const randomPasswordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
  const user = await prisma.user.create({
    data: {
      email: profile.email,
      username,
      displayName: profile.displayName || username,
      passwordHash: randomPasswordHash,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      passwordChangedAt: new Date(),
      wallets: {
        create: {
          type: WalletType.INTERNAL_REWARD,
          currencyCode: "TOKENS",
          balance: 100,
          nonWithdrawable: true
        }
      },
      oauthAccounts: {
        create: {
          provider: profile.provider,
          providerUserId: profile.providerUserId,
          email: profile.email,
          emailVerified: profile.emailVerified,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          metadata: profile.metadata as never
        }
      }
    },
    include: {
      wallets: true
    }
  });

  await createAuditLog({
    actorUserId: user.id,
    action: "auth.oauth.register",
    entityType: "user",
    entityId: user.id,
    after: {
      email: user.email,
      username: user.username,
      role: user.role,
      provider: profile.provider
    },
    ipAddress: input.ipAddress
  });

  return createAuthSession(user);
}

export async function getConnectedOAuthAccounts(userId: string) {
  return prisma.userOAuthAccount.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      provider: true,
      email: true,
      emailVerified: true,
      displayName: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true
    }
  });
}
