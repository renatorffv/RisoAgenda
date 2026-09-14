import type { AppointmentStatus, NotificationType, UserRole } from "./enums";

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  image?: string | null;
}

export interface ServiceDTO {
  id: string;
  professionalId: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  active: boolean;
}

export interface WeeklyAvailabilityDTO {
  id: string;
  professionalId: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface AvailabilityBlockDTO {
  id: string;
  professionalId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string | null;
}

export interface AppointmentDTO {
  id: string;
  professionalId: string;
  clientId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  cancelledBy?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  professional?: UserDTO;
  client?: UserDTO;
  service?: ServiceDTO;
}

export interface MessageDTO {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface ConversationDTO {
  contact: UserDTO;
  lastMessage?: MessageDTO;
  unreadCount: number;
}

export interface NotificationDTO {
  id: string;
  userId: string;
  type: NotificationType;
  content: string;
  relatedId?: string | null;
  read: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserDTO;
}

export interface ApiErrorBody {
  error: string;
  details?: unknown;
}
