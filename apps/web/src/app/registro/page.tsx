"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, UserRole, type RegisterInput } from "@risoagenda/shared";
import { Logo } from "@/components/Logo";
import { Button, FieldError, Input, Label } from "@/components/ui";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { ApiError, useAuth } from "@/lib/auth-context";

function RoleTabs({ role, onChange }: { role: UserRole; onChange: (role: UserRole) => void }) {
  return (
    <div className="mb-5 grid grid-cols-2 gap-2 rounded-full bg-brand-50 p-1">
      {(
        [
          { value: UserRole.CLIENTE, label: "Sou cliente" },
          { value: UserRole.PROFISSIONAL, label: "Sou profissional" },
        ] as const
      ).map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-full px-3 py-2 text-sm font-medium transition ${
            role === option.value ? "bg-brand-500 text-white shadow-sm" : "text-brand-700 hover:bg-brand-100"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function RegistroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("perfil") === "PROFISSIONAL" ? UserRole.PROFISSIONAL : UserRole.CLIENTE;

  const { register: registerUser } = useAuth();
  const [role, setRole] = useState<UserRole>(initialRole);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: initialRole },
  });

  function handleRoleChange(newRole: UserRole) {
    setRole(newRole);
    setValue("role", newRole);
  }

  async function onSubmit(data: RegisterInput) {
    setFormError(null);
    try {
      const user = await registerUser({ ...data, role });
      router.replace(user.role === "PROFISSIONAL" ? "/profissional" : "/cliente");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Não foi possível criar a conta");
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-brand-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Logo size={48} />
          </Link>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-brand-900">Criar conta</h1>
          <p className="mt-1 text-sm text-neutral-500">Escolha seu perfil e preencha seus dados.</p>

          <div className="mt-5">
            <RoleTabs role={role} onChange={handleRoleChange} />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" autoComplete="name" {...register("name")} />
              <FieldError message={errors.name?.message} />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
              <FieldError message={errors.email?.message} />
            </div>
            <div>
              <Label htmlFor="phone">Telefone (opcional)</Label>
              <Input id="phone" autoComplete="tel" placeholder="(11) 90000-0000" {...register("phone")} />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
              <FieldError message={errors.password?.message} />
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-neutral-400">
            <div className="h-px flex-1 bg-neutral-200" />
            ou
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          <GoogleSignInButton role={role} />

          <p className="mt-6 text-center text-sm text-neutral-500">
            Já tem conta?{" "}
            <Link href="/login" className="font-medium text-brand-700 hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegistroPage() {
  return (
    <Suspense fallback={null}>
      <RegistroForm />
    </Suspense>
  );
}
