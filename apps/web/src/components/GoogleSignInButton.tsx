"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@risoagenda/shared";
import { useAuth } from "@/lib/auth-context";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  /** Papel a ser usado caso seja necessário criar uma conta nova (fluxo de registro). */
  role?: UserRole;
  /** Chamado quando o Google informa que é uma conta nova e falta escolher o papel (fluxo de login). */
  onNeedsRole?: () => void;
}

export function GoogleSignInButton({ role, onNeedsRole }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { loginWithGoogle } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    let attempts = 0;

    function tryInit() {
      if (cancelled) return;
      if (window.google?.accounts?.id && containerRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential: string }) => {
            setError(null);
            try {
              const user = await loginWithGoogle(response.credential, role);
              router.replace(user.role === "PROFISSIONAL" ? "/profissional" : "/cliente");
            } catch (err) {
              const apiErr = err as { message?: string; details?: { needsRole?: boolean } };
              if (apiErr?.details?.needsRole) {
                onNeedsRole?.();
              } else {
                setError(apiErr?.message ?? "Não foi possível entrar com o Google");
              }
            }
          },
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          width: 320,
          locale: "pt-BR",
        });
      } else if (attempts < 50) {
        attempts += 1;
        setTimeout(tryInit, 100);
      }
    }

    tryInit();
    return () => {
      cancelled = true;
    };
  }, [clientId, loginWithGoogle, onNeedsRole, role, router]);

  if (!clientId) {
    return (
      <p className="text-xs text-center text-neutral-400">
        Login com Google não configurado (defina NEXT_PUBLIC_GOOGLE_CLIENT_ID).
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={containerRef} />
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
    </div>
  );
}
