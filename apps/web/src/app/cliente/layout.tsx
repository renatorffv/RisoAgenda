"use client";

import { UserRole } from "@risoagenda/shared";
import { AppShell } from "@/components/AppShell";
import { useRequireRole } from "@/lib/hooks";

const NAV_ITEMS = [
  { href: "/agendar", label: "Agendar" },
  { href: "/agendamentos", label: "Meus agendamentos" },
  { href: "/mensagens", label: "Mensagens" },
];

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  const { ready } = useRequireRole(UserRole.CLIENTE);

  if (!ready) {
    return <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">Carregando...</div>;
  }

  return (
    <AppShell basePath="/cliente" navItems={NAV_ITEMS}>
      {children}
    </AppShell>
  );
}
