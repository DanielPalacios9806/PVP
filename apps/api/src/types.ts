import type { Request } from "express";
import type { JwtPayload } from "jsonwebtoken";

export interface AuthUser extends JwtPayload {
  sub: string;
  role: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
