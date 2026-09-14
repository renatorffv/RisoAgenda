import type {
  Appointment,
  AvailabilityBlock,
  Message,
  Notification,
  Service,
  User,
  WeeklyAvailability,
} from "@prisma/client";
import type {
  AppointmentDTO,
  AvailabilityBlockDTO,
  MessageDTO,
  NotificationDTO,
  ServiceDTO,
  UserDTO,
  WeeklyAvailabilityDTO,
} from "@risoagenda/shared";

export function serializeUser(user: User): UserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserDTO["role"],
    phone: user.phone,
    image: user.image,
  };
}

export function serializeService(service: Service): ServiceDTO {
  return {
    id: service.id,
    professionalId: service.professionalId,
    name: service.name,
    description: service.description,
    durationMinutes: service.durationMinutes,
    price: service.price,
    active: service.active,
  };
}

export function serializeWeeklyAvailability(item: WeeklyAvailability): WeeklyAvailabilityDTO {
  return {
    id: item.id,
    professionalId: item.professionalId,
    weekday: item.weekday,
    startTime: item.startTime,
    endTime: item.endTime,
  };
}

export function serializeAvailabilityBlock(item: AvailabilityBlock): AvailabilityBlockDTO {
  return {
    id: item.id,
    professionalId: item.professionalId,
    date: item.date,
    startTime: item.startTime,
    endTime: item.endTime,
    reason: item.reason,
  };
}

export function serializeAppointment(
  appointment: Appointment & { professional?: User; client?: User; service?: Service }
): AppointmentDTO {
  return {
    id: appointment.id,
    professionalId: appointment.professionalId,
    clientId: appointment.clientId,
    serviceId: appointment.serviceId,
    date: appointment.date,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    status: appointment.status as AppointmentDTO["status"],
    cancelledBy: appointment.cancelledBy,
    cancelReason: appointment.cancelReason,
    createdAt: appointment.createdAt.toISOString(),
    professional: appointment.professional ? serializeUser(appointment.professional) : undefined,
    client: appointment.client ? serializeUser(appointment.client) : undefined,
    service: appointment.service ? serializeService(appointment.service) : undefined,
  };
}

export function serializeMessage(message: Message): MessageDTO {
  return {
    id: message.id,
    senderId: message.senderId,
    receiverId: message.receiverId,
    content: message.content,
    read: message.read,
    createdAt: message.createdAt.toISOString(),
  };
}

export function serializeNotification(notification: Notification): NotificationDTO {
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type as NotificationDTO["type"],
    content: notification.content,
    relatedId: notification.relatedId,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  };
}
