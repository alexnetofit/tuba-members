-- ============================================================
-- Concursos + relação M2M com disciplinas + bucket de capas
-- ============================================================

create table if not exists public.tuba_concursos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text unique not null,
  descricao text,
  banca text,
  ano integer,
  capa_url text,
  cor text not null default '#0a1d3a',
  ordem integer not null default 0,
  publicado boolean not null default false,
  acesso_livre boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tuba_concursos_publicado_idx on public.tuba_concursos(publicado);
create index if not exists tuba_concursos_ordem_idx on public.tuba_concursos(ordem);

drop trigger if exists tuba_concursos_updated_at on public.tuba_concursos;
create trigger tuba_concursos_updated_at before update on public.tuba_concursos
  for each row execute function public.tuba_set_updated_at();

create table if not exists public.tuba_concurso_disciplinas (
  concurso_id uuid not null references public.tuba_concursos(id) on delete cascade,
  disciplina_id uuid not null references public.tuba_disciplinas(id) on delete cascade,
  ordem integer not null default 0,
  primary key (concurso_id, disciplina_id)
);
create index if not exists tuba_concurso_disciplinas_concurso_idx on public.tuba_concurso_disciplinas(concurso_id);
create index if not exists tuba_concurso_disciplinas_disciplina_idx on public.tuba_concurso_disciplinas(disciplina_id);

alter table public.tuba_concursos enable row level security;
alter table public.tuba_concurso_disciplinas enable row level security;

drop policy if exists concursos_select on public.tuba_concursos;
create policy concursos_select on public.tuba_concursos
  for select to authenticated
  using (publicado = true or public.tuba_is_admin(auth.uid()));

drop policy if exists concursos_admin on public.tuba_concursos;
create policy concursos_admin on public.tuba_concursos
  for all to authenticated
  using (public.tuba_is_admin(auth.uid()))
  with check (public.tuba_is_admin(auth.uid()));

drop policy if exists concurso_disc_select on public.tuba_concurso_disciplinas;
create policy concurso_disc_select on public.tuba_concurso_disciplinas
  for select to authenticated
  using (
    exists (
      select 1 from public.tuba_concursos c
      where c.id = concurso_id and (c.publicado = true or public.tuba_is_admin(auth.uid()))
    )
  );

drop policy if exists concurso_disc_admin on public.tuba_concurso_disciplinas;
create policy concurso_disc_admin on public.tuba_concurso_disciplinas
  for all to authenticated
  using (public.tuba_is_admin(auth.uid()))
  with check (public.tuba_is_admin(auth.uid()));

grant select on public.tuba_concursos to authenticated;
grant select on public.tuba_concurso_disciplinas to authenticated;

-- Bucket público para capas (servidas direto via URL pública)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('tuba-concursos-capas', 'tuba-concursos-capas', true, 10485760,
   array['image/png','image/jpeg','image/webp','image/avif'])
on conflict (id) do nothing;

drop policy if exists tuba_concursos_capas_admin_write on storage.objects;
create policy tuba_concursos_capas_admin_write on storage.objects
  for all to authenticated
  using (bucket_id = 'tuba-concursos-capas' and public.tuba_is_admin(auth.uid()))
  with check (bucket_id = 'tuba-concursos-capas' and public.tuba_is_admin(auth.uid()));

-- Função agregada para a vitrine do aluno (1 query no lugar de N+1)
create or replace function public.tuba_vitrine_concursos(p_user_id uuid)
returns table (
  id uuid,
  nome text,
  slug text,
  descricao text,
  banca text,
  ano integer,
  capa_url text,
  cor text,
  ordem integer,
  total_disciplinas bigint,
  total_aulas bigint
) language sql stable security invoker set search_path = public as $$
  select
    c.id, c.nome, c.slug, c.descricao, c.banca, c.ano, c.capa_url, c.cor, c.ordem,
    coalesce(dstats.qtd_disc, 0) as total_disciplinas,
    coalesce(astats.qtd_aulas, 0) as total_aulas
  from public.tuba_concursos c
  left join (
    select concurso_id, count(*)::bigint as qtd_disc
    from public.tuba_concurso_disciplinas
    group by concurso_id
  ) dstats on dstats.concurso_id = c.id
  left join (
    select cd.concurso_id, count(distinct a.id)::bigint as qtd_aulas
    from public.tuba_concurso_disciplinas cd
    join public.tuba_aulas a on a.disciplina_id = cd.disciplina_id
    where a.publicada = true
    group by cd.concurso_id
  ) astats on astats.concurso_id = c.id
  where c.publicado = true or public.tuba_is_admin(p_user_id)
  order by c.ordem, c.nome;
$$;

grant execute on function public.tuba_vitrine_concursos(uuid) to authenticated;
