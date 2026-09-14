/** Utilidades de horário compartilhadas entre API e web. Horários são sempre strings "HH:mm". */

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function addMinutes(time: string, minutesToAdd: number): string {
  return minutesToTime(timeToMinutes(time) + minutesToAdd);
}

/** Retorna true se os intervalos [aStart, aEnd) e [bStart, bEnd) se sobrepõem. */
export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(bStart) < timeToMinutes(aEnd);
}

/** Retorna true se [innerStart, innerEnd) está totalmente contido em [outerStart, outerEnd). */
export function rangeContains(
  outerStart: string,
  outerEnd: string,
  innerStart: string,
  innerEnd: string
): boolean {
  return timeToMinutes(innerStart) >= timeToMinutes(outerStart) && timeToMinutes(innerEnd) <= timeToMinutes(outerEnd);
}

export const WEEKDAYS_PT: string[] = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];
