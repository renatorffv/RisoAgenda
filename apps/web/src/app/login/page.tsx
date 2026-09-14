"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@risoagenda/shared";
import { Logo } from "@/components/Logo";
import { Button, FieldError, Input, Label } from "@/components/ui";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { ApiError, useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [needsRoleHint, setNeedsRoleHint] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setFormError(null);
    try {
      const user = await login(data);
      router.replace(user.role === "PROFISSIONAL" ? "/profissional" : "/cliente");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Não foi possível entrar");
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
          <h1 className="text-lg font-semibold text-brand-900">Entrar</h1>
          <p className="mt-1 text-sm text-neutral-500">Acesse sua conta para continuar.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
              <FieldError message={errors.email?.message} />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
              <FieldError message={errors.password?.message} />
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-neutral-400">
            <div className="h-px flex-1 bg-neutral-200" />
            ou
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          <GoogleSignInButton onNeedsRole={() => setNeedsRoleHint(true)} />
          {needsRoleHint && (
            <p className="mt-3 text-center text-xs text-brand-700">
              Não encontramos uma conta com esse Google. Vá em{" "}
              <Link href="/registro" className="underline">
                Criar conta
              </Link>{" "}
              e escolha seu perfil para se cadastrar.
            </p>
          )}

          <p className="mt-6 text-center text-sm text-neutral-500">
            Ainda não tem conta?{" "}
            <Link href="/registro" className="font-medium text-brand-700 hover:underline">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
