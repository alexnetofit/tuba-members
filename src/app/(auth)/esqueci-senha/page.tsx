import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/marca/logo";
import { EsqueciSenhaForm } from "./form";

export const metadata = { title: "Esqueci minha senha — Curso Tubarão" };

export default function EsqueciSenhaPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Logo className="mb-10" />
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[--foreground-muted] hover:text-[--primary]"
        >
          <ArrowLeft size={14} /> Voltar para o login
        </Link>
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl text-[--foreground]">
          Recuperar senha
        </h1>
        <p className="mt-2 text-sm text-[--foreground-muted]">
          Informe seu email e enviaremos um link para você criar uma nova senha.
        </p>
        <div className="mt-8">
          <EsqueciSenhaForm />
        </div>
      </div>
    </div>
  );
}
