import { z } from "zod";
import { UserRole } from "./enums";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome completo"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(6, "A senha precisa ter no mínimo 6 caracteres"),
  role: z.enum([UserRole.PROFISSIONAL, UserRole.CLIENTE]),
  phone: z.string().trim().optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const googleAuthSchema = z.object({
  idToken: z.string().min(10),
  role: z.enum([UserRole.PROFISSIONAL, UserRole.CLIENTE]).optional(),
});
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do serviço"),
  description: z.string().trim().max(1000).optional().default(""),
  durationMinutes: z.coerce.number().int().min(5, "Duração mínima de 5 minutos").max(600),
  price: z.coerce.number().min(0, "O preço não pode ser negativo"),
  active: z.boolean().optional().default(true),
});
export type ServiceInput = z.infer<typeof serviceSchema>;

export const weeklyAvailabilitySchema = z
  .object({
    weekday: z.coerce.number().int().min(0).max(6),
    startTime: z.string().regex(timeRegex, "Horário inválido"),
    endTime: z.string().regex(timeRegex, "Horário inválido"),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "O horário final deve ser depois do inicial",
    path: ["endTime"],
  });
export type WeeklyAvailabilityInput = z.infer<typeof weeklyAvailabilitySchema>;

export const availabilityBlockSchema = z
  .object({
    date: z.string().regex(dateRegex, "Data inválida"),
    startTime: z.string().regex(timeRegex, "Horário inválido"),
    endTime: z.string().regex(timeRegex, "Horário inválido"),
    reason: z.string().trim().max(200).optional(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "O horário final deve ser depois do inicial",
    path: ["endTime"],
  });
export type AvailabilityBlockInput = z.infer<typeof availabilityBlockSchema>;

export const createAppointmentSchema = z.object({
  professionalId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().regex(dateRegex, "Data inválida"),
  startTime: z.string().regex(timeRegex, "Horário inválido"),
});
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const cancelAppointmentSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;

export const sendMessageSchema = z.object({
  receiverId: z.string().min(1),
  content: z.string().trim().min(1, "Escreva uma mensagem").max(2000),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
