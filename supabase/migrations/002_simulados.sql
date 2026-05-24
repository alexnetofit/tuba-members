-- ============================================================
-- 002_simulados.sql
-- simulados, questoes, tentativas, respostas
-- ============================================================
create table if not exists public.tuba_simulados (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  disciplina_id uuid references public.tuba_disciplinas(id) on delete set null,
  duracao_minutos integer not null default 60,
  pdf_original_url text,
  publicado boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tuba_simulados_publicado_idx on public.tuba_simulados(publicado);
create index if not exists tuba_simulados_disciplina_idx on public.tuba_simulados(disciplina_id);

create table if not exists public.tuba_questoes (
  id uuid primary key default gen_random_uuid(),
  simulado_id uuid not null references public.tuba_simulados(id) on delete cascade,
  numero integer not null,
  enunciado text not null,
  alt_a text not null,
  alt_b text not null,
  alt_c text not null,
  alt_d text not null,
  alt_e text,
  gabarito char(1) not null check (gabarito in ('a','b','c','d','e')),
  comentario text,
  created_at timestamptz not null default now(),
  unique (simulado_id, numero)
);
create index if not exists tuba_questoes_simulado_idx on public.tuba_questoes(simulado_id);

create table if not exists public.tuba_tentativas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  simulado_id uuid not null references public.tuba_simulados(id) on delete cascade,
  iniciado_em timestamptz not null default now(),
  finalizado_em timestamptz,
  nota numeric(5,2),
  acertos integer,
  total_questoes integer,
  tempo_segundos integer
);
create index if not exists tuba_tentativas_user_idx on public.tuba_tentativas(user_id);
create index if not exists tuba_tentativas_simulado_idx on public.tuba_tentativas(simulado_id);
create index if not exists tuba_tentativas_finalizada_idx on public.tuba_tentativas(simulado_id, finalizado_em) where finalizado_em is not null;

create table if not exists public.tuba_respostas (
  id uuid primary key default gen_random_uuid(),
  tentativa_id uuid not null references public.tuba_tentativas(id) on delete cascade,
  questao_id uuid not null references public.tuba_questoes(id) on delete cascade,
  alternativa_marcada char(1) check (alternativa_marcada in ('a','b','c','d','e')),
  correta boolean,
  respondida_em timestamptz not null default now(),
  unique (tentativa_id, questao_id)
);
create index if not exists tuba_respostas_tentativa_idx on public.tuba_respostas(tentativa_id);

drop trigger if exists tuba_simulados_updated_at on public.tuba_simulados;
create trigger tuba_simulados_updated_at before update on public.tuba_simulados
  for each row execute function public.tuba_set_updated_at();
