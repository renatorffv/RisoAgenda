import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Button, Card } from "@/components/ui";

export default function Home() {
  return (
    <div className="flex-1 bg-gradient-to-b from-brand-50 via-white to-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Logo />
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-brand-700 hover:text-brand-800">
            Entrar
          </Link>
          <Link href="/registro">
            <Button>Criar conta</Button>
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-20 pt-10 text-center">
        <span className="inline-block rounded-full bg-brand-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
          Agenda para manicure e pedicure
        </span>
        <h1 className="mt-6 text-4xl font-semibold leading-tight text-brand-900 sm:text-5xl">
          Agende seus horários de beleza
          <br /> sem trocar mensagens
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-neutral-600">
          O RisoAgenda conecta profissionais de manicure e pedicure às suas clientes: horários
          disponíveis sempre atualizados, serviços com duração e valor claros, e agendamento em
          poucos cliques.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/registro?perfil=CLIENTE">
            <Button className="px-6 py-3 text-base">Sou cliente, quero agendar</Button>
          </Link>
          <Link href="/registro?perfil=PROFISSIONAL">
            <Button variant="secondary" className="px-6 py-3 text-base">
              Sou profissional
            </Button>
          </Link>
        </div>

        <div className="mt-16 grid gap-5 text-left sm:grid-cols-3">
          <Card>
            <h3 className="font-semibold text-brand-800">Disponibilidade sempre em dia</h3>
            <p className="mt-2 text-sm text-neutral-600">
              A profissional configura os dias e horários de atendimento, e o sistema nunca deixa
              dois horários se sobreporem.
            </p>
          </Card>
          <Card>
            <h3 className="font-semibold text-brand-800">Serviços com duração e preço</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Cadastre manicure, pedicure e combos com a duração certa — o horário reservado se
              ajusta automaticamente.
            </p>
          </Card>
          <Card>
            <h3 className="font-semibold text-brand-800">Mensagens e notificações</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Fale diretamente com a cliente ou a profissional e receba um aviso sempre que chegar
              uma mensagem ou um novo agendamento.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
