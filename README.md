# RisoAgenda

Agenda de horários para manicure e pedicure. Front-end em Next.js, back-end em Node.js/Express, pensados como aplicações separadas (API REST) para facilitar uma futura migração para app Android.

## Estrutura

```
apps/
  api/    -> Node.js + Express + TypeScript + Prisma (SQLite)
  web/    -> Next.js 16 (App Router) + TypeScript + Tailwind CSS
packages/
  shared/ -> Tipos e validações (Zod) compartilhados entre API e web
```

## Pré-requisitos

- Node.js 18+ (testado com Node 24)
- npm 10+

## Como rodar localmente

```bash
npm install

# variáveis de ambiente (já vêm com valores padrão para dev local)
# apps/api/.env          -> DATABASE_URL, JWT_SECRET, GOOGLE_CLIENT_ID, PORT, CORS_ORIGIN
# apps/web/.env.local    -> NEXT_PUBLIC_API_URL, NEXT_PUBLIC_GOOGLE_CLIENT_ID

# cria o banco SQLite, roda as migrações e popula com dados de exemplo
npm run db:migrate
npm run db:seed

# sobe API (porta 3333) e web (porta 3000) juntos
npm run dev
```

Acesse http://localhost:3000.

Contas de teste criadas pelo seed (senha `123456` para as duas):

- Profissional: `profissional@risoagenda.com`
- Cliente: `cliente@risoagenda.com`

## Login com Google

O login com Google usa o Google Identity Services no front-end (o botão só aparece se `NEXT_PUBLIC_GOOGLE_CLIENT_ID` estiver definido) e o back-end valida o `id_token` recebido via `google-auth-library`. Para habilitar:

1. Crie um projeto e uma credencial OAuth 2.0 (tipo "Web application") no [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Adicione `http://localhost:3000` nas origens JavaScript autorizadas.
3. Copie o Client ID para `apps/api/.env` (`GOOGLE_CLIENT_ID`) e `apps/web/.env.local` (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`).

Sem isso configurado, o site funciona normalmente com login por e-mail e senha.

## Arquitetura, em resumo

- Toda a regra de negócio (cálculo de horário de término pela duração do serviço, checagem de conflitos, cancelamento, mensagens, notificações) vive na API. O front-end só consome a API via `Authorization: Bearer <token>`. Isso significa que um futuro app Android pode reaproveitar 100% da API — inclusive o mesmo endpoint `/auth/google`, que já é o formato usado pelo Google Sign-In no Android.
- Banco de dados: SQLite via Prisma, para rodar sem infraestrutura extra. Para produção, troque `provider` em `apps/api/prisma/schema.prisma` para `postgresql` e ajuste `DATABASE_URL` (ex: Neon, Supabase, Railway).
- Notificações são em-app, com polling a cada 15s (sininho no topo). Uma evolução natural é trocar por push (Web Push ou Firebase Cloud Messaging quando existir o app Android).

## Scripts úteis

- `npm run dev` — roda API e web juntos
- `npm run build` — build de produção dos três pacotes
- `npm run db:migrate` — aplica migrações do Prisma
- `npm run db:seed` — repopula os dados de exemplo

## Próximos passos (fora do escopo desta primeira versão)

- Deploy em produção (Vercel para o `web`, Railway/Render para a `api` + Postgres).
- Notificações push reais (Web Push / FCM).
- Pagamento online.
- App Android nativo (a API já está pronta para ser consumida por ele).
