"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AppointmentDTO } from "@risoagenda/shared";
import { appointmentsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Badge, Button, Card } from "@/components/ui";
import { formatDateLongBR, formatPrice } from "@/lib/format";

const STATUS_TONE: Record<string, "brand" | "gray" | "red" | "green"> = {
  CONFIRMADO: "brand",
  CANCELADO: "red",
  CONCLUIDO: "green",
};

const STATUS_LABEL: Record<string, string> = {
  CONFIRMADO: "Confirmado",
  CANCELADO: "Cancelado",
  CONCLUIDO: "Concluído",
};

export default function AgendamentosPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments", "client"],
    queryFn: () => appointmentsApi.list(token!),
    enabled: !!token,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.cancel(token!, id, "Cancelado pela cliente"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setCancellingId(null);
    },
  });

  const grouped = useMemo(() => {
    const map = new Map<string, AppointmentDTO[]>();
    for (const appt of appointments ?? []) {
      if (!map.has(appt.date)) map.set(appt.date, []);
      map.get(appt.date)!.push(appt);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [appointments]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-900">Meus agendamentos</h1>
      <p className="mt-1 text-sm text-neutral-500">Acompanhe e gerencie seus horários marcados.</p>

      <div className="mt-6 space-y-6">
        {isLoading && <p className="text-sm text-neutral-400">Carregando...</p>}

        {!isLoading && grouped.length === 0 && (
          <Card className="text-center text-sm text-neutral-400">Você ainda não tem agendamentos.</Card>
        )}

        {grouped.map(([date, items]) => (
          <div key={date}>
            <h2 className="mb-2 text-sm font-semibold text-brand-800">{formatDateLongBR(date)}</h2>
            <div className="space-y-3">
              {items.map((appt) => (
                <Card key={appt.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-neutral-800">
                      {appt.startTime} – {appt.endTime} · {appt.service?.name}
                    </p>
                    <p className="text-sm text-neutral-500">Com {appt.professional?.name}</p>
                    {appt.status === "CANCELADO" && appt.cancelReason && (
                      <p className="mt-1 text-xs text-red-500">Motivo: {appt.cancelReason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-neutral-500">{formatPrice(appt.service?.price ?? 0)}</span>
                    <Badge tone={STATUS_TONE[appt.status]}>{STATUS_LABEL[appt.status]}</Badge>
                    {appt.status === "CONFIRMADO" && (
                      <Button
                        variant="danger"
                        className="px-3 py-1.5 text-xs"
                        disabled={cancelMutation.isPending && cancellingId === appt.id}
                        onClick={() => {
                          setCancellingId(appt.id);
                          cancelMutation.mutate(appt.id);
                        }}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
