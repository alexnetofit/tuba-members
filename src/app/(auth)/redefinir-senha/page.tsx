import { Logo } from "@/components/marca/logo";
import { RedefinirSenhaForm } from "./form";

export const metadata = { title: "Definir nova senha — Curso Tubarão" };

export default function RedefinirSenhaPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Logo className="mb-10" />
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl text-[--foreground]">
          Criar nova senha
        </h1>
        <p className="mt-2 text-sm text-[--foreground-muted]">
          Defina uma nova senha para sua conta. Mínimo de 8 caracteres.
        </p>
        <div className="mt-8">
          <RedefinirSenhaForm />
        </div>
      </div>
    </div>
  );
}
