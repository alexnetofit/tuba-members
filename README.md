# Curso Tubarão EAOF 2027 — Área de Membros

Plataforma de membros do **Curso Tubarão** (Prof. Alex Alvarez), construída em Next.js 16 + Supabase + Vercel.

## Funcionalidades

### Aluno (`/app`)
- Dashboard com progresso por disciplina, próxima aula e posição no ranking
- Aulas organizadas por disciplina (player YouTube + materiais para download)
- Simulados full-screen com cronômetro, navegação entre questões e auto-save no `localStorage`
- Resultado com gabarito comentado e comparação com média da turma
- Ranking geral e por disciplina, com pódio dourado top 3
- Sistema de conquistas/badges automáticas

### Admin (`/admin`)
- KPIs e visão geral (alunos ativos, tentativas, top alunos)
- CRUD de alunos (criar via senha temporária)
- CRUD de disciplinas, aulas e materiais (upload PDFs para Supabase Storage)
- **Criação de simulado por OCR**: sobe um PDF → extração automática via `pdf-parse` (texto) ou **Mistral OCR** (escaneado) → revisão obrigatória de cada questão → publicação

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **TailwindCSS v4**
- **Supabase**: Auth + Postgres + Storage + Row Level Security
- **Mistral OCR API** (opcional, para PDFs escaneados)
- **Vercel** (deploy)

## Setup

### 1. Banco de dados Supabase

Crie um projeto novo em [supabase.com](https://supabase.com) e rode as migrations da pasta `supabase/migrations/` na ordem:

1. `001_core_tables.sql` — profiles, disciplinas, aulas, materiais
2. `002_simulados.sql` — simulados, questões, tentativas, respostas
3. `003_gamification.sql` — conquistas, views de ranking
4. `004_rls_policies.sql` — Row Level Security
5. `005_seed_storage.sql` — disciplinas iniciais (Português/Legislação/Administração) + storage buckets

Pode rodar tudo direto no **SQL Editor** do dashboard Supabase.

### 2. Variáveis de ambiente

Crie um `.env.local` na raiz:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# Opcional - habilita OCR de PDFs escaneados
# Pegue em https://console.mistral.ai/api-keys
MISTRAL_API_KEY=

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

As chaves estão em `Project Settings → API` do Supabase.

### 3. Criar o primeiro admin

Acesse `Authentication → Users → Add User` no dashboard Supabase e crie um usuário. Depois, no **SQL Editor**:

```sql
update public.tuba_profiles set role = 'admin' where email = 'seu@email.com';
```

### 4. Rodar local

```bash
npm install
npm run dev
```

Abre em http://localhost:3000.

## Estrutura

```
src/
  app/
    (auth)/        # login, esqueci-senha, redefinir-senha
    (app)/app/     # área protegida do aluno
    (admin)/admin/ # área protegida admin (role = 'admin')
    api/simulados/ocr/  # endpoint OCR (pdf-parse + Mistral)
  components/
    ui/            # botão, input, card, dialog, etc.
    marca/         # logo, pódio
    layout/        # sidebars
    aulas/         # player YouTube
  lib/
    supabase/      # client, server, middleware, types
    auth/          # actions, get-user helper
    admin/         # server actions (CRUDs, simulados)
    ocr/           # pdf-parse + Mistral + parser de questões
supabase/migrations/  # SQL versionado
```

## Deploy na Vercel

1. Conecte o repositório no painel da Vercel
2. Configure as mesmas variáveis de ambiente do `.env.local`
3. Em `Authentication → URL Configuration` do Supabase, adicione a URL de produção em **Site URL** e **Redirect URLs** (`https://SEU-APP.vercel.app/redefinir-senha`)

## Notas

- O middleware (`src/middleware.ts`) protege todas as rotas exceto `/`, `/login` e fluxo de senha
- Convenção `middleware.ts` foi renomeada para `proxy.ts` no Next 16 — funciona, mas gera warning de deprecação (rename quando quiser)
- O bucket `tuba-avatars` é público, os outros (`tuba-materiais`, `tuba-simulados-pdf`) são privados com signed URLs
- Para OCR, sem `MISTRAL_API_KEY`, PDFs escaneados (sem camada de texto) não serão processados — o pdf-parse só funciona com PDFs vetoriais

## Sobre o OCR de simulado

O fluxo é em 3 etapas:

1. **Upload** — PDF para a API route `/api/simulados/ocr`
2. **Extração** — tenta `pdf-parse` primeiro (rápido e gratuito); se vazio, cai pro Mistral OCR API (state-of-the-art em português)
3. **Parser** (`lib/ocr/parser.ts`) — heurística de regex que detecta:
   - Início de questão: `Questão N`, `N.`, `N)`, `(N)`, `0N -`
   - Alternativas: `a)`, `A)`, `(A)`, `A -`, `A.`
   - Blocos de gabarito ao final: `GABARITO`, `RESPOSTAS`, `1-A 2-B`
4. **Revisão obrigatória** — admin confirma/edita cada questão e marca o gabarito antes de publicar
