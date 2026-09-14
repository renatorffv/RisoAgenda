import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/errors";
import { serializeUser } from "../lib/serialize";
import { requireAuth } from "../middleware/auth";

export const professionalsRouter = Router();

professionalsRouter.use(requireAuth);

professionalsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const professionals = await prisma.user.findMany({
      where: { role: "PROFISSIONAL" },
      orderBy: { name: "asc" },
    });
    res.json(professionals.map(serializeUser));
  })
);
