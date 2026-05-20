import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { getAuthProfile } from "../../utils/auth-profile.js";
import type { AuthenticatedRequest } from "../../types.js";

export const usersRouter = Router();

usersRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const user = await getAuthProfile(request.user!.sub);

    response.json(user);
  })
);
