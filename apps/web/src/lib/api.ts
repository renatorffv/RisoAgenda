import type {
  AppointmentDTO,
  AuthResponse,
  AvailabilityBlockDTO,
  ConversationDTO,
  CreateAppointmentInput,
  GoogleAuthInput,
  LoginInput,
  MessageDTO,
  NotificationDTO,
  RegisterInput,
  ServiceDTO,
  ServiceInput,
  UserDTO,
  WeeklyAvailabilityDTO,
  WeeklyAvailabilityInput,
  AvailabilityBlockInput,
} from "@risoagenda/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : undefined;

  if (!res.ok) {
    throw new ApiError(data?.error ?? "Erro inesperado ao falar com o servidor", res.status, data?.details);
  }

  return data as T;
}

export const authApi = {
  register: (input: RegisterInput) => request<AuthResponse>("/auth/register", { method: "POST", body: input }),
  login: (input: LoginInput) => request<AuthResponse>("/auth/login", { method: "POST", body: input }),
  google: (input: GoogleAuthInput) => request<AuthResponse>("/auth/google", { method: "POST", body: input }),
  me: (token: string) => request<UserDTO>("/auth/me", { token }),
};

export const professionalsApi = {
  list: (token: string) => request<UserDTO[]>("/professionals", { token }),
};

export const servicesApi = {
  list: (token: string, professionalId?: string) =>
    request<ServiceDTO[]>(`/services${professionalId ? `?professionalId=${professionalId}` : ""}`, { token }),
  create: (token: string, input: ServiceInput) =>
    request<ServiceDTO>("/services", { method: "POST", body: input, token }),
  update: (token: string, id: string, input: ServiceInput) =>
    request<ServiceDTO>(`/services/${id}`, { method: "PUT", body: input, token }),
  remove: (token: string, id: string) => request<void>(`/services/${id}`, { method: "DELETE", token }),
};

export const availabilityApi = {
  listWeekly: (token: string, professionalId?: string) =>
    request<WeeklyAvailabilityDTO[]>(`/availability/weekly${professionalId ? `?professionalId=${professionalId}` : ""}`, {
      token,
    }),
  createWeekly: (token: string, input: WeeklyAvailabilityInput) =>
    request<WeeklyAvailabilityDTO>("/availability/weekly", { method: "POST", body: input, token }),
  removeWeekly: (token: string, id: string) =>
    request<void>(`/availability/weekly/${id}`, { method: "DELETE", token }),
  listBlocks: (token: string, professionalId?: string) =>
    request<AvailabilityBlockDTO[]>(`/availability/blocks${professionalId ? `?professionalId=${professionalId}` : ""}`, {
      token,
    }),
  createBlock: (token: string, input: AvailabilityBlockInput) =>
    request<AvailabilityBlockDTO>("/availability/blocks", { method: "POST", body: input, token }),
  removeBlock: (token: string, id: string) => request<void>(`/availability/blocks/${id}`, { method: "DELETE", token }),
  slots: (token: string, professionalId: string, date: string, serviceId: string) =>
    request<{ date: string; serviceId: string; durationMinutes: number; slots: string[] }>(
      `/availability/slots?professionalId=${professionalId}&date=${date}&serviceId=${serviceId}`,
      { token }
    ),
};

export const appointmentsApi = {
  list: (token: string, params?: { status?: string; date?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request<AppointmentDTO[]>(`/appointments${query ? `?${query}` : ""}`, { token });
  },
  create: (token: string, input: CreateAppointmentInput) =>
    request<AppointmentDTO>("/appointments", { method: "POST", body: input, token }),
  cancel: (token: string, id: string, reason?: string) =>
    request<AppointmentDTO>(`/appointments/${id}/cancel`, { method: "POST", body: { reason }, token }),
};

export const messagesApi = {
  conversations: (token: string) => request<ConversationDTO[]>("/messages/conversations", { token }),
  withContact: (token: string, contactId: string) => request<MessageDTO[]>(`/messages/${contactId}`, { token }),
  send: (token: string, receiverId: string, content: string) =>
    request<MessageDTO>("/messages", { method: "POST", body: { receiverId, content }, token }),
};

export const notificationsApi = {
  list: (token: string) => request<NotificationDTO[]>("/notifications", { token }),
  markRead: (token: string, id: string) => request<void>(`/notifications/${id}/read`, { method: "POST", token }),
  markAllRead: (token: string) => request<void>("/notifications/read-all", { method: "POST", token }),
};
