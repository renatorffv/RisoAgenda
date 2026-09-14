import jwt from "jsonwebtoken";
import { env } from "./env";
import type { UserRole } from "@risoagenda/shared";

export interface AppJwtPayload {
  sub: string;
  role: UserRole;
  name: string;
  email: string;
}

export function signToken(payload: AppJwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "30d" });
}

export function verifyToken(token: string): AppJwtPayload {
  return jwt.verify(token, env.jwtSecret) as AppJwtPayload;
}
