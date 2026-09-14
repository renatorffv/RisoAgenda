import { Router } from "express";
import { addMinutes, cancelAppointmentSchema, createAppointmentSchema, UserRole } from "@risoagenda/shared";
import { prisma } from "../lib/prisma";
import { AppError, ForbiddenError, NotFoundError, asyncHandler } from "../lib/errors";
import { serializeAppointment } from "../lib/serialize";
import { requireAuth, requireRole } from "../middleware/auth";
import { isSlotAvailable } from "../lib/scheduling";
import { createNotification } from "../lib/notify";

export const appointmentsRouter = Router();

const appointmentInclude = {
  professional: true,
  client: true,
  service: true,
} as const;

appointmentsRouter.use(requireAuth);

appointmentsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const isProfessional = req.user!.role === UserRole.PROFISSIONAL;
    const where = isProfessional ? { professionalId: req.user!.id } : { clientId: req.user!.id };

    const status = req.query.status as string | undefined;
    const date = req.query.date as string | undefined;

    const appointments = await prisma.appointment.findMany({
      where: { ...where, ...(status ? { status: status as any } : {}), ...(date ? { date } : {}) },
      include: appointmentInclude,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    res.json(appointments.map(serializeAppointment));
  })
);

appointmentsRouter.post(
  "/",
  requireRole(UserRole.CLIENTE),
  asyncHandler(async (req, res) => {
    const data = createAppointmentSchema.parse(req.body);

    const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
    if (!service || service.professionalId !== data.professionalId || !service.active) {
      throw new NotFoundError("Serviço não encontrado para essa profissional");
    }

    const endTime = addMinutes(data.startTime, service.durationMinutes);

    const appointment = await prisma.$transaction(async (tx) => {
      const check = await isSlotAvailable({
        professionalId: data.professionalId,
        date: data.date,
        startTime: data.startTime,
        endTime,
      });
      if (!check.available) {
        throw new AppError(check.reason ?? "Horário indisponível", 409);
      }

      return tx.appointment.create({
        data: {
          professionalId: data.professionalId,
          clientId: req.user!.id,
          serviceId: data.serviceId,
          date: data.date,
          startTime: data.startTime,
          endTime,
        },
        include: appointmentInclude,
      });
    });

    await createNotification({
      userId: appointment.professionalId,
      type: "NOVO_AGENDAMENTO",
      content: `${req.user!.name} agendou ${service.name} para ${data.date} às ${data.startTime}`,
      relatedId: appointment.id,
    });

    res.status(201).json(serializeAppointment(appointment));
  })
);

appointmentsRouter.post(
  "/:id/cancel",
  asyncHandler(async (req, res) => {
    const { reason } = cancelAppointmentSchema.parse(req.body ?? {});
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: appointmentInclude,
    });
    if (!appointment) throw new NotFoundError("Agendamento não encontrado");

    const isParty = appointment.professionalId === req.user!.id || appointment.clientId === req.user!.id;
    if (!isParty) throw new ForbiddenError();

    if (appointment.status !== "CONFIRMADO") {
      throw new AppError("Esse agendamento já não está mais confirmado", 409);
    }

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: "CANCELADO", cancelledBy: req.user!.id, cancelReason: reason },
      include: appointmentInclude,
    });

    const otherPartyId =
      req.user!.id === appointment.professionalId ? appointment.clientId : appointment.professionalId;
    await createNotification({
      userId: otherPartyId,
      type: "AGENDAMENTO_CANCELADO",
      content: `${req.user!.name} cancelou o agendamento de ${appointment.service.name} em ${appointment.date} às ${appointment.startTime}`,
      relatedId: appointment.id,
    });

    res.json(serializeAppointment(updated));
  })
);
