import { Router } from "express";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middlewares/auth.js";
import { createRateLimiter } from "../../middlewares/rate-limit.js";
import type { AuthenticatedRequest } from "../../types.js";
import { getAuthProfile } from "../../utils/auth-profile.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { getRequestIp } from "../../utils/request-ip.js";
import { changePasswordSchema, loginSchema, registerSchema } from "./auth.schemas.js";
import { changePassword, createAuthSession, loginUser, registerUser } from "./auth.service.js";
import {
  completeOAuthLogin,
  createOAuthRedirectUrl,
  getConnectedOAuthAccounts,
  getOAuthProviders
} from "./oauth.service.js";
import { createAuditLog } from "../audit/audit.service.js";

export const authRouter = Router();
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many authentication attempts. Please try again later."
});
const oauthRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: "Too many OAuth attempts. Please try again later."
});

function frontendRedirect(path: string) {
  return new URL(path, env.FRONTEND_URL ?? env.CORS_ORIGIN).toString();
}

function oauthSuccessRedirect(result: Awaited<ReturnType<typeof completeOAuthLogin>>) {
  const payload = Buffer.from(JSON.stringify(result), "utf8").toString("base64url");
  return frontendRedirect(`/auth/oauth/callback#payload=${encodeURIComponent(payload)}`);
}

function oauthFailureRedirect() {
  return frontendRedirect("/auth/login?error=oauth_failed");
}

authRouter.post(
  "/register",
  authRateLimiter,
  asyncHandler(async (request, response) => {
    const payload = registerSchema.parse(request.body);
    const user = await registerUser({
      ...payload,
      ipAddress: getRequestIp(request)
    });

    response.status(201).json(createAuthSession(user));
  })
);

authRouter.post(
  "/login",
  authRateLimiter,
  asyncHandler(async (request, response) => {
    const payload = loginSchema.parse(request.body);
    const result = await loginUser({
      ...payload,
      ipAddress: getRequestIp(request)
    });

    response.json(result);
  })
);

authRouter.get(
  "/oauth/providers",
  asyncHandler(async (_request, response) => {
    response.json(getOAuthProviders());
  })
);

authRouter.get(
  "/oauth/accounts",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const accounts = await getConnectedOAuthAccounts(request.user!.sub);
    response.json(accounts);
  })
);

authRouter.get(
  "/oauth/google",
  oauthRateLimiter,
  asyncHandler(async (request, response) => {
    try {
      const url = await createOAuthRedirectUrl("google", getRequestIp(request));
      response.redirect(url);
    } catch (error) {
      await createAuditLog({
        action: "auth.oauth.fail",
        entityType: "oauth",
        metadata: {
          provider: "google",
          reason: error instanceof Error ? error.message : "unknown"
        },
        ipAddress: getRequestIp(request)
      });
      response.redirect(oauthFailureRedirect());
    }
  })
);

authRouter.get(
  "/oauth/google/callback",
  oauthRateLimiter,
  asyncHandler(async (request, response) => {
    const code = typeof request.query.code === "string" ? request.query.code : "";
    const state = typeof request.query.state === "string" ? request.query.state : "";

    if (!code || !state) {
      response.redirect(oauthFailureRedirect());
      return;
    }

    try {
      const result = await completeOAuthLogin({
        provider: "google",
        code,
        state,
        ipAddress: getRequestIp(request)
      });
      response.redirect(oauthSuccessRedirect(result));
    } catch (error) {
      await createAuditLog({
        action: "auth.oauth.fail",
        entityType: "oauth",
        metadata: {
          provider: "google",
          reason: error instanceof Error ? error.message : "unknown"
        },
        ipAddress: getRequestIp(request)
      });
      response.redirect(oauthFailureRedirect());
    }
  })
);

authRouter.get(
  "/oauth/facebook",
  oauthRateLimiter,
  asyncHandler(async (request, response) => {
    try {
      const url = await createOAuthRedirectUrl("facebook", getRequestIp(request));
      response.redirect(url);
    } catch (error) {
      await createAuditLog({
        action: "auth.oauth.fail",
        entityType: "oauth",
        metadata: {
          provider: "facebook",
          reason: error instanceof Error ? error.message : "unknown"
        },
        ipAddress: getRequestIp(request)
      });
      response.redirect(oauthFailureRedirect());
    }
  })
);

authRouter.get(
  "/oauth/facebook/callback",
  oauthRateLimiter,
  asyncHandler(async (request, response) => {
    const code = typeof request.query.code === "string" ? request.query.code : "";
    const state = typeof request.query.state === "string" ? request.query.state : "";

    if (!code || !state) {
      response.redirect(oauthFailureRedirect());
      return;
    }

    try {
      const result = await completeOAuthLogin({
        provider: "facebook",
        code,
        state,
        ipAddress: getRequestIp(request)
      });
      response.redirect(oauthSuccessRedirect(result));
    } catch (error) {
      await createAuditLog({
        action: "auth.oauth.fail",
        entityType: "oauth",
        metadata: {
          provider: "facebook",
          reason: error instanceof Error ? error.message : "unknown"
        },
        ipAddress: getRequestIp(request)
      });
      response.redirect(oauthFailureRedirect());
    }
  })
);

authRouter.post(
  "/logout",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.sub },
      select: { id: true }
    });

    if (user) {
      await createAuditLog({
        actorUserId: user.id,
        action: "auth.logout",
        entityType: "user",
        entityId: user.id,
        ipAddress: getRequestIp(request)
      });
    }

    response.status(204).send();
  })
);

authRouter.patch(
  "/change-password",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const payload = changePasswordSchema.parse(request.body);
    const user = await changePassword({
      userId: request.user!.sub,
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword,
      ipAddress: getRequestIp(request)
    });

    response.json(user);
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const profile = await getAuthProfile(request.user!.sub);
    response.json(profile);
  })
);
