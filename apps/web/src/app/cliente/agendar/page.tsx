"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addMinutes } from "@risoagenda/shared";
import { appointmentsApi, availabilityApi, professionalsApi, servicesApi } from "@/lib/api";
import { ApiError, useAuth } from "@/lib/auth-context";
import { Button, Card, Label } from "@/components/ui";
import { formatDurationMinutes, formatPrice, todayStr } from "@/lib/format";

export default function AgendarPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [professionalId, setProfessionalId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(todayStr());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: professionals } = useQuery({
    queryKey: ["professionals"],
    queryFn: () => professionalsApi.list(token!),
    enabled: !!token,
  });

  useEffect(() => {
    if (!professionalId && professionals && professionals.length > 0) {
      setProfessionalId(professionals[0].id);
    }
  }, [professionals, professionalId]);

  const { data: services } = useQuery({
    queryKey: ["services", professionalId],
    queryFn: () => servicesApi.list(token!, professionalId),
    enabled: !!token && !!professionalId,
  });

  useEffect(() => {
    setServiceId("");
    setSelectedSlot(null);
  }, [professionalId]);

  useEffect(() => {
    setSelectedSlot(null);
  }, [serviceId, date]);

  const { data: slotsData, isFetching: loadingSlots } = useQuery({
    queryKey: ["slots", professionalId, date, serviceId],
    queryFn: () => availabilityApi.slots(token!, professionalId, date, serviceId),
    enabled: !!token && !!professionalId && !!serviceId && !!date,
  });

  const selectedService = services?.find((s) => s.id === serviceId);

  const bookMutation = useMutation({
    mutationFn: () => appointmentsApi.create(token!, { professionalId, serviceId, date, startTime: selectedSlot! }),
    onSuccess: () => {
      setSuccess(`Agendamento confirmado para ${date} às ${selectedSlot}!`);
      setError(null);
      setSelectedSlot(null);
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err) => {
      setSuccess(null);
      setError(err instanceof ApiError ? err.message : "Não foi possível agendar. Tente outro horário.");
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-900">Agendar horário</h1>
      <p className="mt-1 text-sm text-neutral-500">Escolha o serviço, a data e o horário que preferir.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="space-y-4">
            {professionals && professionals.length > 1 && (
              <div>
                <Label htmlFor="professional">Profissional</Label>
                <select
                  id="professional"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-400"
                  value={professionalId}
                  onChange={(e) => setProfessionalId(e.target.value)}
                >
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label htmlFor="service">Serviço</Label>
              <select
                id="service"
                className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-400"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                disabled={!services?.length}
              >
                <option value="">Selecione um serviço</option>
                {services?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {formatDurationMinutes(s.durationMinutes)} · {formatPrice(s.price)}
                  </option>
                ))}
              </select>
              {selectedService?.description && (
                <p className="mt-1 text-xs text-neutral-400">{selectedService.description}</p>
              )}
            </div>

            <div>
              <Label htmlFor="date">Data</Label>
              <input
                id="date"
                type="date"
                min={todayStr()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-400"
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-brand-800">Horários livres</h2>
          {!serviceId && <p className="mt-3 text-sm text-neutral-400">Escolha um serviço para ver os horários.</p>}
          {serviceId && loadingSlots && <p className="mt-3 text-sm text-neutral-400">Buscando horários...</p>}
          {serviceId && !loadingSlots && slotsData?.slots.length === 0 && (
            <p className="mt-3 text-sm text-neutral-400">Nenhum horário livre nesse dia. Tente outra data.</p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {slotsData?.slots.map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                  selectedSlot === slot
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-brand-200 bg-white text-brand-700 hover:bg-brand-50"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>

          {selectedSlot && selectedService && (
            <div className="mt-5 rounded-xl bg-brand-50 p-4 text-sm">
              <p className="font-medium text-brand-800">Resumo do agendamento</p>
              <p className="mt-1 text-neutral-600">
                {selectedService.name} · {date} das {selectedSlot} às{" "}
                {addMinutes(selectedSlot, selectedService.durationMinutes)}
              </p>
              <p className="text-neutral-600">Valor: {formatPrice(selectedService.price)}</p>

              {error && <p className="mt-2 text-red-600">{error}</p>}
              {success && <p className="mt-2 text-emerald-600">{success}</p>}

              <Button className="mt-3" onClick={() => bookMutation.mutate()} disabled={bookMutation.isPending}>
                {bookMutation.isPending ? "Confirmando..." : "Confirmar agendamento"}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
