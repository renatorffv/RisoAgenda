export const UserRole = {
  PROFISSIONAL: "PROFISSIONAL",
  CLIENTE: "CLIENTE",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const AppointmentStatus = {
  CONFIRMADO: "CONFIRMADO",
  CANCELADO: "CANCELADO",
  CONCLUIDO: "CONCLUIDO",
} as const;
export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const NotificationType = {
  NOVO_AGENDAMENTO: "NOVO_AGENDAMENTO",
  AGENDAMENTO_CANCELADO: "AGENDAMENTO_CANCELADO",
  NOVA_MENSAGEM: "NOVA_MENSAGEM",
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
