"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { messagesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button, Input } from "@/components/ui";

export function ChatView({ basePath, contactId }: { basePath: "/profissional" | "/cliente"; contactId: string }) {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => messagesApi.conversations(token!),
    enabled: !!token,
  });
  const contact = conversations?.find((c) => c.contact.id === contactId)?.contact;

  const { data: messages } = useQuery({
    queryKey: ["messages", contactId],
    queryFn: () => messagesApi.withContact(token!, contactId),
    enabled: !!token,
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => messagesApi.send(token!, contactId, content),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["messages", contactId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }, [messages, queryClient]);

  return (
    <div className="flex h-[70vh] flex-col rounded-2xl border border-brand-100 bg-white">
      <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3">
        <Link href={`${basePath}/mensagens`} className="text-brand-600 hover:underline text-sm">
          ← Voltar
        </Link>
        <h2 className="font-semibold text-neutral-800">{contact?.name ?? "Conversa"}</h2>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages?.map((m) => {
          const mine = m.senderId === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                  mine ? "bg-brand-500 text-white" : "bg-brand-50 text-neutral-800"
                }`}
              >
                <p>{m.content}</p>
                <span className={`mt-1 block text-[10px] ${mine ? "text-brand-100" : "text-neutral-400"}`}>
                  {new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          );
        })}
        {messages?.length === 0 && (
          <p className="text-center text-sm text-neutral-400">Envie a primeira mensagem para {contact?.name ?? "essa pessoa"}.</p>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="flex gap-2 border-t border-neutral-100 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) sendMutation.mutate(text.trim());
        }}
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva uma mensagem..."
          className="flex-1"
        />
        <Button type="submit" disabled={sendMutation.isPending || !text.trim()}>
          Enviar
        </Button>
      </form>
    </div>
  );
}
