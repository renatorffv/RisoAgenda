"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  href: string;
  label: string;
}

export function AppShell({
  basePath,
  navItems,
  children,
}: {
  basePath: "/profissional" | "/cliente";
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-brand-50/40">
      <header className="border-b border-brand-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between">
            <Link href={basePath}>
              <Logo size={32} />
            </Link>
            <div className="flex items-center gap-2 sm:hidden">
              <NotificationBell basePath={basePath} />
            </div>
          </div>

          <nav className="flex flex-wrap gap-1">
            {navItems.map((item) => {
              const href = `${basePath}${item.href}`;
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                    active ? "bg-brand-500 text-white" : "text-brand-700 hover:bg-brand-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <NotificationBell basePath={basePath} />
            <div className="text-right">
              <p className="text-sm font-medium text-neutral-800">{user?.name}</p>
              <button onClick={logout} className="text-xs text-brand-600 hover:underline">
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>

      <div className="border-t border-brand-100 bg-white px-4 py-3 text-center text-xs text-neutral-400 sm:hidden">
        {user?.name} ·{" "}
        <button onClick={logout} className="text-brand-600 hover:underline">
          Sair
        </button>
      </div>
    </div>
  );
}
