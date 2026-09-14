import { Router } from "express";
import { availabilityBlockSchema, rangesOverlap, UserRole, weeklyAvailabilitySchema } from "@risoagenda/shared";
import { prisma } from "../lib/prisma";
import { AppError, ForbiddenError, NotFoundError, asyncHandler } from "../lib/errors";
import { serializeAvailabilityBlock, serializeWeeklyAvailability } from "../lib/serialize";
import { requireAuth, requireRole } from "../middleware/auth";
import { computeFreeSlots, weekdayOf } from "../lib/scheduling";

export const availabilityRouter = Router();

availabilityRouter.use(requireAuth);

availabilityRouter.get(
  "/weekly",
  asyncHandler(async (req, res) => {
    const professionalId = (req.query.professionalId as string) ?? req.user!.id;
    const items = await prisma.weeklyAvailability.findMany({
      where: { professionalId },
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    });
    res.json(items.map(serializeWeeklyAvailability));
  })
);

availabilityRouter.post(
  "/weekly",
  requireRole(UserRole.PROFISSIONAL),
  asyncHandler(async (req, res) => {
    const data = weeklyAvailabilitySchema.parse(req.body);

    const sameDay = await prisma.weeklyAvailability.findMany({
      where: { professionalId: req.user!.id, weekday: data.weekday },
    });
    const overlaps = sameDay.some((d) => rangesOverlap(data.startTime, data.endTime, d.startTime, d.endTime));
    if (overlaps) {
      throw new AppError("Esse intervalo se sobrepõe a um horário já cadastrado nesse dia", 409);
    }

    const created = await prisma.weeklyAvailability.create({
      data: { ...data, professionalId: req.user!.id },
    });
    res.status(201).json(serializeWeeklyAvailability(created));
  })
);

availabilityRouter.delete(
  "/weekly/:id",
  requireRole(UserRole.PROFISSIONAL),
  asyncHandler(async (req, res) => {
    const existing = await prisma.weeklyAvailability.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError();
    if (existing.professionalId !== req.user!.id) throw new ForbiddenError();
    await prisma.weeklyAvailability.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

availabilityRouter.get(
  "/blocks",
  asyncHandler(async (req, res) => {
    const professionalId = (req.query.professionalId as string) ?? req.user!.id;
    const items = await prisma.availabilityBlock.findMany({
      where: { professionalId },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
    res.json(items.map(serializeAvailabilityBlock));
  })
);

availabilityRouter.post(
  "/blocks",
  requireRole(UserRole.PROFISSIONAL),
  asyncHandler(async (req, res) => {
    const data = availabilityBlockSchema.parse(req.body);
    const created = await prisma.availabilityBlock.create({
      data: { ...data, professionalId: req.user!.id },
    });
    res.status(201).json(serializeAvailabilityBlock(created));
  })
);

availabilityRouter.delete(
  "/blocks/:id",
  requireRole(UserRole.PROFISSIONAL),
  asyncHandler(async (req, res) => {
    const existing = await prisma.availabilityBlock.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError();
    if (existing.professionalId !== req.user!.id) throw new ForbiddenError();
    await prisma.availabilityBlock.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

availabilityRouter.get(
  "/slots",
  asyncHandler(async (req, res) => {
    const professionalId = req.query.professionalId as string;
    const date = req.query.date as string;
    const serviceId = req.query.serviceId as string;

    if (!professionalId || !date || !serviceId) {
      throw new AppError("Informe professionalId, date e serviceId", 400);
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || service.professionalId !== professionalId) {
      throw new NotFoundError("Serviço não encontrado para essa profissional");
    }

    const weekday = weekdayOf(date);
    const [weeklyRanges, blocks, busyAppointments] = await Promise.all([
      prisma.weeklyAvailability.findMany({ where: { professionalId, weekday } }),
      prisma.availabilityBlock.findMany({ where: { professionalId, date } }),
      prisma.appointment.findMany({ where: { professionalId, date, status: "CONFIRMADO" } }),
    ]);

    const todayStr = new Date().toISOString().slice(0, 10);
    const nowTime = new Date().toTimeString().slice(0, 5);

    const slots = computeFreeSlots({
      weeklyRanges,
      blocks,
      busy: busyAppointments,
      durationMinutes: service.durationMinutes,
      minStartTime: date === todayStr ? nowTime : undefined,
    });

    res.json({ date, serviceId, durationMinutes: service.durationMinutes, slots });
  })
);
