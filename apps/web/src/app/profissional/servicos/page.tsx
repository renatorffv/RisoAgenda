"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { serviceSchema, type ServiceDTO, type ServiceInput } from "@risoagenda/shared";
import { servicesApi } from "@/lib/api";
import { ApiError, useAuth } from "@/lib/auth-context";
import { Badge, Button, Card, FieldError, Input, Label, Textarea } from "@/components/ui";
import { formatDurationMinutes, formatPrice } from "@/lib/format";

const emptyValues: ServiceInput = { name: "", description: "", durationMinutes: 60, price: 0, active: true };

export default function ServicosPage() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ServiceDTO | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: services, isLoading } = useQuery({
    queryKey: ["services", user?.id],
    queryFn: () => servicesApi.list(token!, user!.id),
    enabled: !!token && !!user,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ServiceInput>({ resolver: zodResolver(serviceSchema), defaultValues: emptyValues });

  useEffect(() => {
    reset(editing ? { ...editing } : emptyValues);
  }, [editing, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: ServiceInput) =>
      editing ? servicesApi.update(token!, editing.id, data) : servicesApi.create(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setShowForm(false);
      setEditing(null);
      reset(emptyValues);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Não foi possível salvar o serviço"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => servicesApi.remove(token!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });

  function openNew() {
    setEditing(null);
    setError(null);
    setShowForm(true);
  }

  function openEdit(service: ServiceDTO) {
    setEditing(service);
    setError(null);
    setShowForm(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-900">Serviços</h1>
          <p className="mt-1 text-sm text-neutral-500">Cadastre os serviços que você oferece, com duração e valor.</p>
        </div>
        <Button onClick={openNew}>Novo serviço</Button>
      </div>

      {showForm && (
        <Card className="mt-5">
          <h2 className="font-semibold text-brand-800">{editing ? "Editar serviço" : "Novo serviço"}</h2>
          <form
            className="mt-4 grid gap-4 sm:grid-cols-2"
            onSubmit={handleSubmit((data) => {
              setError(null);
              saveMutation.mutate(data);
            })}
          >
            <div className="sm:col-span-2">
              <Label htmlFor="name">Nome do serviço</Label>
              <Input id="name" placeholder="Ex: Manicure" {...register("name")} />
              <FieldError message={errors.name?.message} />
            </div>
            <div>
              <Label htmlFor="durationMinutes">Duração (minutos)</Label>
              <Input id="durationMinutes" type="number" step={5} min={5} {...register("durationMinutes")} />
              <FieldError message={errors.durationMinutes?.message} />
            </div>
            <div>
              <Label htmlFor="price">Valor (R$)</Label>
              <Input id="price" type="number" step={0.01} min={0} {...register("price")} />
              <FieldError message={errors.price?.message} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" rows={3} {...register("description")} />
            </div>

            {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={isSubmitting || saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p className="text-sm text-neutral-400">Carregando...</p>}
        {!isLoading && services?.length === 0 && (
          <Card className="text-center text-sm text-neutral-400 sm:col-span-2 lg:col-span-3">
            Nenhum serviço cadastrado ainda.
          </Card>
        )}
        {services?.map((service) => (
          <Card key={service.id} className="flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-neutral-800">{service.name}</h3>
              {!service.active && <Badge tone="gray">Inativo</Badge>}
            </div>
            {service.description && <p className="text-sm text-neutral-500">{service.description}</p>}
            <div className="mt-1 flex items-center gap-2 text-sm">
              <Badge tone="gold">{formatDurationMinutes(service.durationMinutes)}</Badge>
              <span className="font-medium text-brand-700">{formatPrice(service.price)}</span>
            </div>
            <div className="mt-2 flex gap-2">
              <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => openEdit(service)}>
                Editar
              </Button>
              <Button
                variant="ghost"
                className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                disabled={removeMutation.isPending}
                onClick={() => removeMutation.mutate(service.id)}
              >
                Excluir
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
