import { Router } from "express";
import { adminRouter } from "../modules/admin/admin.routes.js";
import { authRouter } from "../modules/auth/auth.routes.js";
import { disputesRouter } from "../modules/disputes/disputes.routes.js";
import { matchesRouter } from "../modules/matches/matches.routes.js";
import { registrationsRouter } from "../modules/registrations/registrations.routes.js";
import { riotRouter } from "../modules/riot/riot.routes.js";
import { spacesRouter } from "../modules/spaces/spaces.routes.js";
import { teamsRouter } from "../modules/teams/teams.routes.js";
import { tournamentsRouter } from "../modules/tournaments/tournaments.routes.js";
import { usersRouter } from "../modules/users/users.routes.js";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { getRiotRuntimeConfig } from "../modules/riot/riot.client.js";

export const apiRouter = Router();

apiRouter.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

apiRouter.get("/health/runtime", (_request, response) => {
  const riot = getRiotRuntimeConfig();

  response.json({
    status: "ok",
    service: "arena-os-api",
    serverEnv: env.SERVER_ENV,
    nodeEnv: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    corsOriginsConfigured: env.CORS_ALLOWED_ORIGINS.length,
    trustProxy: env.TRUST_PROXY,
    riot: {
      mode: riot.mode,
      platformRoute: riot.region,
      regionalRoute: riot.regionalRoute,
      tournamentApiEnabled: riot.tournamentApiEnabled,
      readyForAccountLookup: riot.readyForAccountLookup,
      readyForTournamentCodes: riot.readyForTournamentCodes
    }
  });
});

apiRouter.get("/health/readiness", async (_request, response) => {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    response.json({
      status: "ready",
      service: "arena-os-api",
      database: "ok",
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString()
    });
  } catch {
    response.status(503).json({
      status: "degraded",
      service: "arena-os-api",
      database: "unavailable",
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString()
    });
  }
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/teams", teamsRouter);
apiRouter.use("/spaces", spacesRouter);
apiRouter.use("/tournaments", tournamentsRouter);
apiRouter.use("/registrations", registrationsRouter);
apiRouter.use("/matches", matchesRouter);
apiRouter.use("/disputes", disputesRouter);
apiRouter.use("/riot", riotRouter);
