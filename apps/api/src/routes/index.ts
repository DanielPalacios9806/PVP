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

export const apiRouter = Router();

apiRouter.get("/health", (_request, response) => {
  response.json({ status: "ok" });
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
