"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@risoagenda/shared";
import { useAuth } from "./auth-context";

/** Garante que a rota só é usada por usuários autenticados com o papel esperado. */
export function useRequireRole(role: UserRole) {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && user && user.role !== role) {
      router.replace(user.role === "PROFISSIONAL" ? "/profissional" : "/cliente");
    }
  }, [status, user, role, router]);

  return { ready: status === "authenticated" && user?.role === role, user };
}
