import { Router } from "express";
import { serviceSchema, UserRole } from "@risoagenda/shared";
import { prisma } from "../lib/prisma";
import { ForbiddenError, NotFoundError, asyncHandler } from "../lib/errors";
import { serializeService } from "../lib/serialize";
import { requireAuth, requireRole } from "../middleware/auth";

export const servicesRouter = Router();

servicesRouter.use(requireAuth);

servicesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const professionalId = (req.query.professionalId as string) ?? req.user!.id;
    const isOwner = req.user!.id === professionalId;

    const services = await prisma.service.findMany({
      where: { professionalId, ...(isOwner ? {} : { active: true }) },
      orderBy: { name: "asc" },
    });

    res.json(services.map(serializeService));
  })
);

servicesRouter.post(
  "/",
  requireRole(UserRole.PROFISSIONAL),
  asyncHandler(async (req, res) => {
    const data = serviceSchema.parse(req.body);
    const service = await prisma.service.create({
      data: { ...data, professionalId: req.user!.id },
    });
    res.status(201).json(serializeService(service));
  })
);

servicesRouter.put(
  "/:id",
  requireRole(UserRole.PROFISSIONAL),
  asyncHandler(async (req, res) => {
    const data = serviceSchema.parse(req.body);
    const existing = await prisma.service.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError("Serviço não encontrado");
    if (existing.professionalId !== req.user!.id) throw new ForbiddenError();

    const updated = await prisma.service.update({ where: { id: existing.id }, data });
    res.json(serializeService(updated));
  })
);

servicesRouter.delete(
  "/:id",
  requireRole(UserRole.PROFISSIONAL),
  asyncHandler(async (req, res) => {
    const existing = await prisma.service.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError("Serviço não encontrado");
    if (existing.professionalId !== req.user!.id) throw new ForbiddenError();

    const appointmentCount = await prisma.appointment.count({ where: { serviceId: existing.id } });
    if (appointmentCount > 0) {
      const updated = await prisma.service.update({ where: { id: existing.id }, data: { active: false } });
      res.json({ ...serializeService(updated), archived: true });
      return;
    }

    await prisma.service.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);
