"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { NotificationDTO } from "@risoagenda/shared";
import { notificationsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

function notificationHref(n: NotificationDTO): string {
  if (n.type === "NOVA_MENSAGEM") return `/mensagens/${n.relatedId ?? ""}`;
  return "/agenda";
}

export function NotificationBell({ basePath }: { basePath: "/profissional" | "/cliente" }) {
  const { token } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list(token!),
    enabled: !!token,
    refetchInterval: 15000,
  });

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  async function handleClick(n: NotificationDTO) {
    if (!token) return;
    if (!n.read) {
      await notificationsApi.markRead(token, n.id);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
    setOpen(false);
    router.push(`${basePath}${notificationHref(n)}`);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-brand-100 bg-white text-brand-700 hover:bg-brand-50"
        aria-label="Notificações"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-brand-100 bg-white shadow-lg">
            <div className="border-b border-neutral-100 px-4 py-3 text-sm font-semibold text-brand-900">
              Notificações
            </div>
            {!notifications || notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-neutral-400">Nenhuma notificação por aqui.</p>
            ) : (
              <ul>
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => handleClick(n)}
                      className={`block w-full px-4 py-3 text-left text-sm hover:bg-brand-50 ${
                        n.read ? "text-neutral-500" : "bg-brand-50/60 font-medium text-brand-900"
                      }`}
                    >
                      <p className="line-clamp-2">{n.content}</p>
                      <span className="mt-1 block text-xs text-neutral-400">{timeAgo(n.createdAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 3a5 5 0 00-5 5v3.3c0 .5-.2 1-.5 1.4L5 15h14l-1.5-2.3c-.3-.4-.5-.9-.5-1.4V8a5 5 0 00-5-5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.5 18a2.5 2.5 0 005 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
