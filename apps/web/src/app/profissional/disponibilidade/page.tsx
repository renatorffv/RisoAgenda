"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  WEEKDAYS_PT,
  availabilityBlockSchema,
  weeklyAvailabilitySchema,
  type AvailabilityBlockInput,
  type WeeklyAvailabilityInput,
} from "@risoagenda/shared";
import { availabilityApi } from "@/lib/api";
import { ApiError, useAuth } from "@/lib/auth-context";
import { Button, Card, FieldError, Input, Label } from "@/components/ui";
import { formatDateBR } from "@/lib/format";

export default function DisponibilidadePage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const { data: weekly } = useQuery({
    queryKey: ["availability", "weekly"],
    queryFn: () => availabilityApi.listWeekly(token!),
    enabled: !!token,
  });
  const { data: blocks } = useQuery({
    queryKey: ["availability", "blocks"],
    queryFn: () => availabilityApi.listBlocks(token!),
    enabled: !!token,
  });

  const [weeklyError, setWeeklyError] = useState<string | null>(null);
  const [blockError, setBlockError] = useState<string | null>(null);

  const weeklyForm = useForm<WeeklyAvailabilityInput>({
    resolver: zodResolver(weeklyAvailabilitySchema),
    defaultValues: { weekday: 1, startTime: "09:00", endTime: "18:00" },
  });

  const blockForm = useForm<AvailabilityBlockInput>({
    resolver: zodResolver(availabilityBlockSchema),
    defaultValues: { date: "", startTime: "09:00", endTime: "18:00", reason: "" },
  });

  const addWeekly = useMutation({
    mutationFn: (data: WeeklyAvailabilityInput) => availabilityApi.createWeekly(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability", "weekly"] });
      weeklyForm.reset({ weekday: 1, startTime: "09:00", endTime: "18:00" });
      setWeeklyError(null);
    },
    onError: (err) => setWeeklyError(err instanceof ApiError ? err.message : "Não foi possível salvar"),
  });

  const removeWeekly = useMutation({
    mutationFn: (id: string) => availabilityApi.removeWeekly(token!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["availability", "weekly"] }),
  });

  const addBlock = useMutation({
    mutationFn: (data: AvailabilityBlockInput) => availabilityApi.createBlock(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability", "blocks"] });
      blockForm.reset({ date: "", startTime: "09:00", endTime: "18:00", reason: "" });
      setBlockError(null);
    },
    onError: (err) => setBlockError(err instanceof ApiError ? err.message : "Não foi possível salvar"),
  });

  const removeBlock = useMutation({
    mutationFn: (id: string) => availabilityApi.removeBlock(token!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["availability", "blocks"] }),
  });

  const byWeekday = new Map<number, typeof weekly>();
  for (let i = 0; i < 7; i++) byWeekday.set(i, []);
  weekly?.forEach((item) => byWeekday.get(item.weekday)?.push(item));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-brand-900">Disponibilidade</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Configure os dias e horários em que você atende. As clientes só conseguem agendar dentro desses horários.
        </p>
      </div>

      <Card>
        <h2 className="font-semibold text-brand-800">Horário semanal</h2>
        <div className="mt-4 space-y-3">
          {WEEKDAYS_PT.map((name, weekday) => (
            <div key={weekday} className="flex flex-wrap items-center gap-2 border-b border-neutral-100 pb-3 last:border-0">
              <span className="w-32 shrink-0 text-sm font-medium text-neutral-700">{name}</span>
              <div className="flex flex-wrap gap-2">
                {byWeekday.get(weekday)?.length ? (
                  byWeekday.get(weekday)!.map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700"
                    >
                      {item.startTime} – {item.endTime}
                      <button
                        onClick={() => removeWeekly.mutate(item.id)}
                        className="text-brand-500 hover:text-brand-800"
                        aria-label="Remover"
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-neutral-300">Sem atendimento</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <form
          className="mt-5 flex flex-wrap items-end gap-3"
          onSubmit={weeklyForm.handleSubmit((data) => addWeekly.mutate(data))}
        >
          <div>
            <Label htmlFor="weekday">Dia</Label>
            <select
              id="weekday"
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400"
              {...weeklyForm.register("weekday")}
            >
              {WEEKDAYS_PT.map((name, i) => (
                <option key={i} value={i}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="weeklyStart">Início</Label>
            <Input id="weeklyStart" type="time" {...weeklyForm.register("startTime")} />
          </div>
          <div>
            <Label htmlFor="weeklyEnd">Fim</Label>
            <Input id="weeklyEnd" type="time" {...weeklyForm.register("endTime")} />
          </div>
          <Button type="submit" disabled={addWeekly.isPending}>
            Adicionar
          </Button>
        </form>
        <FieldError message={weeklyForm.formState.errors.endTime?.message} />
        {weeklyError && <p className="mt-1 text-sm text-red-600">{weeklyError}</p>}
      </Card>

      <Card>
        <h2 className="font-semibold text-brand-800">Bloqueios e folgas</h2>
        <p className="mt-1 text-sm text-neutral-500">Bloqueie datas ou horários específicos, mesmo dentro do seu horário normal.</p>

        <div className="mt-4 space-y-2">
          {blocks?.length ? (
            blocks.map((block) => (
              <div
                key={block.id}
                className="flex items-center justify-between rounded-xl border border-neutral-100 px-3 py-2 text-sm"
              >
                <span>
                  {formatDateBR(block.date)} · {block.startTime} – {block.endTime}
                  {block.reason ? ` · ${block.reason}` : ""}
                </span>
                <button onClick={() => removeBlock.mutate(block.id)} className="text-xs text-red-500 hover:underline">
                  Remover
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-neutral-300">Nenhum bloqueio cadastrado.</p>
          )}
        </div>

        <form
          className="mt-5 flex flex-wrap items-end gap-3"
          onSubmit={blockForm.handleSubmit((data) => addBlock.mutate(data))}
        >
          <div>
            <Label htmlFor="blockDate">Data</Label>
            <Input id="blockDate" type="date" {...blockForm.register("date")} />
          </div>
          <div>
            <Label htmlFor="blockStart">Início</Label>
            <Input id="blockStart" type="time" {...blockForm.register("startTime")} />
          </div>
          <div>
            <Label htmlFor="blockEnd">Fim</Label>
            <Input id="blockEnd" type="time" {...blockForm.register("endTime")} />
          </div>
          <div className="flex-1 min-w-[160px]">
            <Label htmlFor="blockReason">Motivo (opcional)</Label>
            <Input id="blockReason" placeholder="Ex: Consulta médica" {...blockForm.register("reason")} />
          </div>
          <Button type="submit" disabled={addBlock.isPending}>
            Bloquear
          </Button>
        </form>
        {blockError && <p className="mt-1 text-sm text-red-600">{blockError}</p>}
      </Card>
    </div>
  );
}
