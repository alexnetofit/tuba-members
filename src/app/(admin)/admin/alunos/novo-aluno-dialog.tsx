"use client";

import { useState, useTransition } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { criarAluno } from "@/lib/admin/actions";

function gerarSenha() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function NovoAlunoDialog() {
  const [open, setOpen] = useState(false);
  const [senha, setSenha] = useState(gerarSenha());
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await criarAluno(formData);
      if (res?.error) toast.error(res.error);
      else if (res?.success) {
        toast.success(res.success);
        setOpen(false);
        setSenha(gerarSenha());
      }
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} /> Novo aluno
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Criar novo aluno"
        description="Defina uma senha temporária e envie pelo WhatsApp ao aluno."
      >
        <form action={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Nome completo</Label>
            <Input id="full_name" name="full_name" required placeholder="Ex: João da Silva" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="aluno@email.com" />
          </div>
          <div>
            <Label htmlFor="role">Papel</Label>
            <Select id="role" name="role" defaultValue="aluno">
              <option value="aluno">Aluno</option>
              <option value="admin">Admin (acesso total)</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="senha">Senha temporária</Label>
            <div className="flex gap-2">
              <Input
                id="senha"
                name="senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                minLength={8}
                required
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setSenha(gerarSenha())}
                aria-label="Gerar nova senha"
              >
                <RefreshCw size={16} />
              </Button>
            </div>
            <p className="mt-1 text-xs text-[--foreground-muted]">
              O aluno pode trocar a senha em &ldquo;Esqueci minha senha&rdquo;.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={pending}>Criar aluno</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
