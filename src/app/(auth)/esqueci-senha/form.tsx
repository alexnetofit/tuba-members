"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { esqueciSenhaAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EsqueciSenhaForm() {
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const res = await esqueciSenhaAction(formData);
      if (res?.error) setMessage({ kind: "err", text: res.error });
      else if (res?.success) setMessage({ kind: "ok", text: res.success });
    });
  }

  return (
    <form action={onSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required placeholder="seu@email.com" />
      </div>
      {message ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.kind === "ok"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {message.text}
        </div>
      ) : null}
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        <Send size={16} /> Enviar link de recuperação
      </Button>
    </form>
  );
}
