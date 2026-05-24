-- ============================================================
-- 003_gamification.sql
-- conquistas, views de ranking, funcoes auxiliares
-- ============================================================
create table if not exists public.tuba_conquistas (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nome text not null,
  descricao text not null,
  icone text not null,
  pontos_bonus integer not null default 0,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.tuba_usuario_conquistas (
  user_id uuid not null references auth.users(id) on delete cascade,
  conquista_id uuid not null references public.tuba_conquistas(id) on delete cascade,
  conquistado_em timestamptz not null default now(),
  primary key (user_id, conquista_id)
);
create index if not exists tuba_usuario_conquistas_user_idx on public.tuba_usuario_conquistas(user_id);

-- Conquistas iniciais
insert into public.tuba_conquistas (codigo, nome, descricao, icone, pontos_bonus, ordem) values
  ('primeiro_simulado', 'Primeira Mordida', 'Concluiu o primeiro simulado', 'Trophy', 50, 1),
  ('nota_perfeita', 'Predador Letal', 'Tirou nota 100 em um simulado', 'Crown', 200, 2),
  ('cinco_simulados_semana', 'Tubarão Faminto', 'Fez 5 simulados em uma semana', 'Flame', 100, 3),
  ('top_10', 'Top 10', 'Entrou no Top 10 do ranking geral', 'Medal', 150, 4),
  ('top_3', 'Pódio', 'Entrou no Top 3 do ranking geral', 'Award', 300, 5),
  ('dez_aulas', 'Estudioso', 'Assistiu 10 aulas', 'BookOpen', 50, 6),
  ('cinquenta_aulas', 'Maratonista', 'Assistiu 50 aulas', 'Zap', 200, 7),
  ('sete_dias', 'Disciplinado', 'Estudou 7 dias seguidos', 'Calendar', 100, 8)
on conflict (codigo) do nothing;

-- Function: calcula nota da tentativa
create or replace function public.tuba_calcular_nota_tentativa(tentativa_uuid uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
  v_acertos int;
  v_nota numeric;
begin
  select count(*) into v_total from public.tuba_respostas r where r.tentativa_id = tentativa_uuid;
  if v_total = 0 then return 0; end if;
  update public.tuba_respostas r
    set correta = (r.alternativa_marcada = q.gabarito)
    from public.tuba_questoes q
    where r.questao_id = q.id and r.tentativa_id = tentativa_uuid;
  select count(*) into v_acertos from public.tuba_respostas where tentativa_id = tentativa_uuid and correta = true;
  select count(*) into v_total
    from public.tuba_questoes q
    join public.tuba_tentativas t on t.simulado_id = q.simulado_id
    where t.id = tentativa_uuid;
  v_nota := round((v_acertos::numeric / nullif(v_total,0)) * 100, 2);
  update public.tuba_tentativas
    set nota = v_nota, acertos = v_acertos, total_questoes = v_total, finalizado_em = coalesce(finalizado_em, now())
    where id = tentativa_uuid;
  return v_nota;
end;
$$;

-- Views (security_invoker = true para respeitar RLS)
drop view if exists public.tuba_ranking_geral cascade;
drop view if exists public.tuba_ranking_disciplina cascade;

create view public.tuba_ranking_geral with (security_invoker = true) as
with melhores as (
  select user_id, simulado_id, max(nota) as melhor_nota
  from public.tuba_tentativas where finalizado_em is not null and nota is not null
  group by user_id, simulado_id
),
stats as (
  select user_id,
    count(distinct simulado_id) as simulados_feitos,
    sum(melhor_nota * 10)::integer as pontos_simulados,
    avg(melhor_nota)::numeric(5,2) as media_geral
  from melhores group by user_id
)
select p.id as user_id, p.full_name, p.avatar_url,
  coalesce(s.simulados_feitos, 0) as simulados_feitos,
  coalesce(s.pontos_simulados, 0) as pontos,
  coalesce(s.media_geral, 0) as media_geral,
  (select count(*) from public.tuba_usuario_conquistas uc where uc.user_id = p.id) as conquistas,
  rank() over (order by coalesce(s.pontos_simulados,0) desc, coalesce(s.media_geral,0) desc) as posicao
from public.tuba_profiles p
left join stats s on s.user_id = p.id
where p.role = 'aluno' and p.ativo = true;

create view public.tuba_ranking_disciplina with (security_invoker = true) as
with melhores as (
  select t.user_id, t.simulado_id, s.disciplina_id, max(t.nota) as melhor_nota
  from public.tuba_tentativas t
  join public.tuba_simulados s on s.id = t.simulado_id
  where t.finalizado_em is not null and t.nota is not null and s.disciplina_id is not null
  group by t.user_id, t.simulado_id, s.disciplina_id
),
stats as (
  select user_id, disciplina_id,
    count(distinct simulado_id) as simulados_feitos,
    sum(melhor_nota * 10)::integer as pontos,
    avg(melhor_nota)::numeric(5,2) as media
  from melhores group by user_id, disciplina_id
)
select p.id as user_id, p.full_name, p.avatar_url,
  s.disciplina_id, d.nome as disciplina_nome,
  s.simulados_feitos, s.pontos, s.media,
  rank() over (partition by s.disciplina_id order by s.pontos desc, s.media desc) as posicao
from stats s
join public.tuba_profiles p on p.id = s.user_id
join public.tuba_disciplinas d on d.id = s.disciplina_id
where p.role = 'aluno' and p.ativo = true;

grant select on public.tuba_ranking_geral to authenticated;
grant select on public.tuba_ranking_disciplina to authenticated;

-- Helper: é admin?
create or replace function public.tuba_is_admin(uid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.tuba_profiles where id = uid and role = 'admin');
$$;

-- Verifica conquistas (acionado por triggers)
create or replace function public.tuba_verificar_conquistas(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_count int;
  v_id uuid;
begin
  select count(*) into v_count from public.tuba_tentativas where user_id = p_user_id and finalizado_em is not null;
  if v_count >= 1 then
    select id into v_id from public.tuba_conquistas where codigo='primeiro_simulado';
    insert into public.tuba_usuario_conquistas(user_id, conquista_id) values (p_user_id, v_id) on conflict do nothing;
  end if;
  select count(*) into v_count from public.tuba_tentativas where user_id = p_user_id and nota = 100;
  if v_count >= 1 then
    select id into v_id from public.tuba_conquistas where codigo='nota_perfeita';
    insert into public.tuba_usuario_conquistas(user_id, conquista_id) values (p_user_id, v_id) on conflict do nothing;
  end if;
  select count(*) into v_count from public.tuba_tentativas where user_id = p_user_id and finalizado_em > now() - interval '7 days';
  if v_count >= 5 then
    select id into v_id from public.tuba_conquistas where codigo='cinco_simulados_semana';
    insert into public.tuba_usuario_conquistas(user_id, conquista_id) values (p_user_id, v_id) on conflict do nothing;
  end if;
  select count(*) into v_count from public.tuba_aulas_assistidas where user_id = p_user_id;
  if v_count >= 10 then
    select id into v_id from public.tuba_conquistas where codigo='dez_aulas';
    insert into public.tuba_usuario_conquistas(user_id, conquista_id) values (p_user_id, v_id) on conflict do nothing;
  end if;
  if v_count >= 50 then
    select id into v_id from public.tuba_conquistas where codigo='cinquenta_aulas';
    insert into public.tuba_usuario_conquistas(user_id, conquista_id) values (p_user_id, v_id) on conflict do nothing;
  end if;
end;
$$;

create or replace function public.tuba_trigger_conquistas_tentativa()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.finalizado_em is not null and (old.finalizado_em is null or old.finalizado_em is distinct from new.finalizado_em) then
    perform public.tuba_verificar_conquistas(new.user_id);
  end if;
  return new;
end; $$;

drop trigger if exists tuba_after_finaliza_tentativa on public.tuba_tentativas;
create trigger tuba_after_finaliza_tentativa
  after update on public.tuba_tentativas
  for each row execute function public.tuba_trigger_conquistas_tentativa();

create or replace function public.tuba_trigger_conquistas_aula()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  perform public.tuba_verificar_conquistas(new.user_id);
  return new;
end; $$;

drop trigger if exists tuba_after_aula_assistida on public.tuba_aulas_assistidas;
create trigger tuba_after_aula_assistida
  after insert on public.tuba_aulas_assistidas
  for each row execute function public.tuba_trigger_conquistas_aula();

-- Revogar EXECUTE de funcoes internas para anon/authenticated
revoke execute on function public.tuba_handle_new_user() from public, anon, authenticated;
revoke execute on function public.tuba_trigger_conquistas_aula() from public, anon, authenticated;
revoke execute on function public.tuba_trigger_conquistas_tentativa() from public, anon, authenticated;
revoke execute on function public.tuba_verificar_conquistas(uuid) from public, anon, authenticated;
revoke execute on function public.tuba_calcular_nota_tentativa(uuid) from public, anon, authenticated;
