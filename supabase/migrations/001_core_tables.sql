-- ============================================================
-- 001_core_tables.sql
-- profiles, disciplinas, aulas, aula_materiais, aulas_assistidas
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create table if not exists public.tuba_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text not null default 'aluno' check (role in ('aluno','admin')),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tuba_profiles_role_idx on public.tuba_profiles(role);
create index if not exists tuba_profiles_ativo_idx on public.tuba_profiles(ativo);

create table if not exists public.tuba_disciplinas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text unique not null,
  cor text not null default '#d4a44a',
  icone text,
  ordem integer not null default 0,
  ativa boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists tuba_disciplinas_ordem_idx on public.tuba_disciplinas(ordem);

create table if not exists public.tuba_aulas (
  id uuid primary key default gen_random_uuid(),
  disciplina_id uuid not null references public.tuba_disciplinas(id) on delete cascade,
  titulo text not null,
  descricao text,
  youtube_url text not null,
  duracao_min integer,
  ordem integer not null default 0,
  publicada boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tuba_aulas_disciplina_idx on public.tuba_aulas(disciplina_id);
create index if not exists tuba_aulas_ordem_idx on public.tuba_aulas(disciplina_id, ordem);

create table if not exists public.tuba_aula_materiais (
  id uuid primary key default gen_random_uuid(),
  aula_id uuid not null references public.tuba_aulas(id) on delete cascade,
  nome text not null,
  url_storage text not null,
  tipo text default 'pdf',
  tamanho_bytes bigint,
  created_at timestamptz not null default now()
);
create index if not exists tuba_aula_materiais_aula_idx on public.tuba_aula_materiais(aula_id);

create table if not exists public.tuba_aulas_assistidas (
  user_id uuid not null references auth.users(id) on delete cascade,
  aula_id uuid not null references public.tuba_aulas(id) on delete cascade,
  assistida_em timestamptz not null default now(),
  primary key (user_id, aula_id)
);
create index if not exists tuba_aulas_assistidas_user_idx on public.tuba_aulas_assistidas(user_id);

-- Trigger: criar profile ao registrar usuário
create or replace function public.tuba_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.tuba_profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'role', 'aluno')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists tuba_on_auth_user_created on auth.users;
create trigger tuba_on_auth_user_created
  after insert on auth.users
  for each row execute function public.tuba_handle_new_user();

create or replace function public.tuba_set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;$$;

drop trigger if exists tuba_profiles_updated_at on public.tuba_profiles;
create trigger tuba_profiles_updated_at before update on public.tuba_profiles
  for each row execute function public.tuba_set_updated_at();

drop trigger if exists tuba_aulas_updated_at on public.tuba_aulas;
create trigger tuba_aulas_updated_at before update on public.tuba_aulas
  for each row execute function public.tuba_set_updated_at();
