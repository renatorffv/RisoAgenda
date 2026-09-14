"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { messagesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Badge, Card } from "@/components/ui";

function timeShort(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return sameDay
    ? date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("pt-BR");
}

export function ConversationList({ basePath }: { basePath: "/profissional" | "/cliente" }) {
  const { token } = useAuth();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => messagesApi.conversations(token!),
    enabled: !!token,
    refetchInterval: 15000,
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-900">Mensagens</h1>
      <p className="mt-1 text-sm text-neutral-500">Converse diretamente com {basePath === "/profissional" ? "suas clientes" : "sua profissional"}.</p>

      <div className="mt-6 space-y-2">
        {isLoading && <p className="text-sm text-neutral-400">Carregando...</p>}
        {!isLoading && conversations?.length === 0 && (
          <Card className="text-center text-sm text-neutral-400">
            Nenhuma conversa ainda. Ela aparece aqui depois do primeiro agendamento ou mensagem.
          </Card>
        )}
        {conversations?.map((conv) => (
          <Link key={conv.contact.id} href={`${basePath}/mensagens/${conv.contact.id}`}>
            <Card className="flex items-center justify-between gap-3 hover:border-brand-300">
              <div className="min-w-0">
                <p className="font-medium text-neutral-800">{conv.contact.name}</p>
                <p className="truncate text-sm text-neutral-500">{conv.lastMessage?.content ?? "Iniciar conversa"}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {conv.lastMessage && (
                  <span className="text-xs text-neutral-400">{timeShort(conv.lastMessage.createdAt)}</span>
                )}
                {conv.unreadCount > 0 && <Badge>{conv.unreadCount}</Badge>}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
