import { addMinutes, rangeContains, rangesOverlap, timeToMinutes } from "@risoagenda/shared";
import { prisma } from "./prisma";

/** Passo (em minutos) usado para gerar os horários candidatos de início de um agendamento. */
export const SLOT_STEP_MINUTES = 15;

/** Calcula o dia da semana (0=domingo..6=sábado) de uma data "YYYY-MM-DD" sem depender do fuso do servidor. */
export function weekdayOf(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

interface Range {
  startTime: string;
  endTime: string;
}

/** Gera os horários de início livres em um dia, dada a disponibilidade, bloqueios, agendamentos e duração do serviço. */
export function computeFreeSlots(params: {
  weeklyRanges: Range[];
  blocks: Range[];
  busy: Range[];
  durationMinutes: number;
  minStartTime?: string; // usado para excluir horários passados no dia atual
}): string[] {
  const { weeklyRanges, blocks, busy, durationMinutes, minStartTime } = params;
  const slots = new Set<string>();

  for (const range of weeklyRanges) {
    let cursor = timeToMinutes(range.startTime);
    const rangeEndMinutes = timeToMinutes(range.endTime);

    while (cursor + durationMinutes <= rangeEndMinutes) {
      const startTime = minutesToTimeLocal(cursor);
      const endTime = addMinutes(startTime, durationMinutes);

      const withinRange = rangeContains(range.startTime, range.endTime, startTime, endTime);
      const blocked = blocks.some((b) => rangesOverlap(startTime, endTime, b.startTime, b.endTime));
      const occupied = busy.some((b) => rangesOverlap(startTime, endTime, b.startTime, b.endTime));
      const isPast = minStartTime ? startTime < minStartTime : false;

      if (withinRange && !blocked && !occupied && !isPast) {
        slots.add(startTime);
      }

      cursor += SLOT_STEP_MINUTES;
    }
  }

  return Array.from(slots).sort();
}

function minutesToTimeLocal(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Confere, direto no banco, se um horário [startTime, startTime+duration) está livre para a profissional na data. */
export async function isSlotAvailable(params: {
  professionalId: string;
  date: string;
  startTime: string;
  endTime: string;
  excludeAppointmentId?: string;
}): Promise<{ available: boolean; reason?: string }> {
  const { professionalId, date, startTime, endTime, excludeAppointmentId } = params;
  const weekday = weekdayOf(date);

  const weeklyRanges = await prisma.weeklyAvailability.findMany({
    where: { professionalId, weekday },
  });
  const withinAvailability = weeklyRanges.some((r) => rangeContains(r.startTime, r.endTime, startTime, endTime));
  if (!withinAvailability) {
    return { available: false, reason: "Fora do horário de atendimento da profissional" };
  }

  const blocks = await prisma.availabilityBlock.findMany({ where: { professionalId, date } });
  const isBlocked = blocks.some((b) => rangesOverlap(startTime, endTime, b.startTime, b.endTime));
  if (isBlocked) {
    return { available: false, reason: "Horário bloqueado pela profissional" };
  }

  const conflicting = await prisma.appointment.findMany({
    where: {
      professionalId,
      date,
      status: "CONFIRMADO",
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
    },
  });
  const hasConflict = conflicting.some((a) => rangesOverlap(startTime, endTime, a.startTime, a.endTime));
  if (hasConflict) {
    return { available: false, reason: "Já existe um agendamento nesse horário" };
  }

  return { available: true };
}
