import { Router } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { googleAuthSchema, loginSchema, registerSchema } from "@risoagenda/shared";
import type { AuthResponse } from "@risoagenda/shared";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { AppError, UnauthorizedError, asyncHandler } from "../lib/errors";
import { serializeUser } from "../lib/serialize";
import { requireAuth } from "../middleware/auth";
import { env } from "../lib/env";

export const authRouter = Router();

const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError("Já existe uma conta com esse e-mail", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        phone: data.phone,
      },
    });

    const token = signToken({ sub: user.id, role: user.role as any, name: user.name, email: user.email });
    const response: AuthResponse = { token, user: serializeUser(user) };
    res.status(201).json(response);
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError("E-mail ou senha inválidos");
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError("E-mail ou senha inválidos");
    }

    const token = signToken({ sub: user.id, role: user.role as any, name: user.name, email: user.email });
    const response: AuthResponse = { token, user: serializeUser(user) };
    res.json(response);
  })
);

authRouter.post(
  "/google",
  asyncHandler(async (req, res) => {
    if (!googleClient) {
      throw new AppError("Login com Google não está configurado no servidor", 501);
    }

    const data = googleAuthSchema.parse(req.body);
    const ticket = await googleClient.verifyIdToken({ idToken: data.idToken, audience: env.googleClientId });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new UnauthorizedError("Token do Google inválido");
    }

    let user = await prisma.user.findUnique({ where: { googleId: payload.sub } });

    if (!user) {
      user = await prisma.user.findUnique({ where: { email: payload.email } });
      if (user) {
        user = await prisma.user.update({ where: { id: user.id }, data: { googleId: payload.sub } });
      }
    }

    if (!user) {
      if (!data.role) {
        throw new AppError("Selecione se você é profissional ou cliente para continuar", 400, {
          needsRole: true,
        });
      }
      user = await prisma.user.create({
        data: {
          name: payload.name ?? payload.email.split("@")[0],
          email: payload.email,
          googleId: payload.sub,
          image: payload.picture,
          role: data.role,
        },
      });
    }

    const token = signToken({ sub: user.id, role: user.role as any, name: user.name, email: user.email });
    const response: AuthResponse = { token, user: serializeUser(user) };
    res.json(response);
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      throw new UnauthorizedError();
    }
    res.json(serializeUser(user));
  })
);
