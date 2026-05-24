import Link from "next/link";
import { Logo } from "@/components/marca/logo";
import { LoginForm } from "./login-form";
import { CheckCircle2, Trophy, Zap, Target } from "lucide-react";

export const metadata = { title: "Entrar — Curso Tubarão EAOF 2027" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Hero esquerda */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden border-r border-[--border]">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0f1f3a] to-[#152b4d]" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #d4a44a 0 1px, transparent 1px 24px)",
            }}
          />
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[--primary]/15 blur-3xl" />
          <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-[--surface-3]/40 blur-3xl" />
        </div>

        <Logo />

        <div className="max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-[--primary]/40 bg-[--primary]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[--primary]">
            <span className="size-1.5 rounded-full bg-[--primary] animate-pulse" />
            Matrículas abertas · EAOF 2027
          </span>
          <h1 className="mt-6 font-[family-name:var(--font-playfair)] text-5xl leading-tight text-[--foreground]">
            Sua aprovação na <span className="gold-text">Aeronáutica</span> começa aqui.
          </h1>
          <p className="mt-5 text-[--foreground-muted] text-lg leading-relaxed">
            Aulas ao vivo, simulados ilimitados, ranking entre alunos e o método com{" "}
            <strong className="text-[--foreground]">o maior índice de aprovação desde 2010.</strong>
          </p>

          <ul className="mt-8 space-y-3 text-sm">
            {[
              { icon: Trophy, text: "1º e 2º colocados em MET · 1º em MUS" },
              { icon: Target, text: "Mais de 50% da turma aprovada anualmente" },
              { icon: Zap, text: "Simulados gerados a partir do próprio caderno de questões" },
              { icon: CheckCircle2, text: "Gravações disponíveis após cada aula" },
            ].map((it, i) => (
              <li key={i} className="flex items-center gap-3 text-[--foreground-muted]">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[--primary]/15 text-[--primary]">
                  <it.icon size={14} />
                </span>
                {it.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="text-xs text-[--foreground-subtle]">
          Prof. Alex Alvarez · Coordenador · (21) 99192-1165
        </div>
      </div>

      {/* Form direita */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="lg:hidden mb-8">
          <Logo />
        </div>
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl text-[--foreground]">
              Bem-vindo de volta.
            </h2>
            <p className="mt-2 text-sm text-[--foreground-muted]">
              Entre com seu email e senha para acessar suas aulas e simulados.
            </p>
          </div>

          <LoginForm redirectTo={params.redirect} />

          <p className="mt-8 text-center text-xs text-[--foreground-subtle]">
            Ainda não é aluno?{" "}
            <Link href="https://wa.me/5521991921165" className="text-[--primary] hover:underline">
              Fale com o Prof. Alex
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
