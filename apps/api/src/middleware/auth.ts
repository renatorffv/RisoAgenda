import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/jwt";
import { ForbiddenError, UnauthorizedError } from "../lib/errors";
import type { UserRole } from "@risoagenda/shared";

export interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new UnauthorizedError("Token de acesso ausente");
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role, name: payload.name, email: payload.email };
    next();
  } catch {
    throw new UnauthorizedError("Token inválido ou expirado");
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError("Essa ação é exclusiva para outro tipo de perfil");
    }
    next();
  };
}
