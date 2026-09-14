"use client";

import { UserRole } from "@risoagenda/shared";
import { AppShell } from "@/components/AppShell";
import { useRequireRole } from "@/lib/hooks";

const NAV_ITEMS = [
  { href: "/agenda", label: "Agenda" },
  { href: "/servicos", label: "Serviços" },
  { href: "/disponibilidade", label: "Disponibilidade" },
  { href: "/mensagens", label: "Mensagens" },
];

export default function ProfissionalLayout({ children }: { children: React.ReactNode }) {
  const { ready } = useRequireRole(UserRole.PROFISSIONAL);

  if (!ready) {
    return <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">Carregando...</div>;
  }

  return (
    <AppShell basePath="/profissional" navItems={NAV_ITEMS}>
      {children}
    </AppShell>
  );
}
