-- ============================================================
-- 004_rls_policies.sql
-- Row Level Security em todas as tabelas
-- ============================================================
alter table public.tuba_profiles enable row level security;
alter table public.tuba_disciplinas enable row level security;
alter table public.tuba_aulas enable row level security;
alter table public.tuba_aula_materiais enable row level security;
alter table public.tuba_aulas_assistidas enable row level security;
alter table public.tuba_simulados enable row level security;
alter table public.tuba_questoes enable row level security;
alter table public.tuba_tentativas enable row level security;
alter table public.tuba_respostas enable row level security;
alter table public.tuba_conquistas enable row level security;
alter table public.tuba_usuario_conquistas enable row level security;

-- tuba_profiles
drop policy if exists "tuba_profiles_select_self" on public.tuba_profiles;
create policy "tuba_profiles_select_self" on public.tuba_profiles
  for select using (auth.uid() = id or public.tuba_is_admin(auth.uid()));

drop policy if exists "tuba_profiles_select_ranking" on public.tuba_profiles;
create policy "tuba_profiles_select_ranking" on public.tuba_profiles
  for select using (role = 'aluno' and ativo = true);

drop policy if exists "tuba_profiles_update_self" on public.tuba_profiles;
create policy "tuba_profiles_update_self" on public.tuba_profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "tuba_profiles_admin_all" on public.tuba_profiles;
create policy "tuba_profiles_admin_all" on public.tuba_profiles
  for all using (public.tuba_is_admin(auth.uid())) with check (public.tuba_is_admin(auth.uid()));

-- tuba_disciplinas
drop policy if exists "tuba_disciplinas_select_all" on public.tuba_disciplinas;
create policy "tuba_disciplinas_select_all" on public.tuba_disciplinas
  for select using (auth.role() = 'authenticated');

drop policy if exists "tuba_disciplinas_admin_all" on public.tuba_disciplinas;
create policy "tuba_disciplinas_admin_all" on public.tuba_disciplinas
  for all using (public.tuba_is_admin(auth.uid())) with check (public.tuba_is_admin(auth.uid()));

-- tuba_aulas
drop policy if exists "tuba_aulas_select_publicadas" on public.tuba_aulas;
create policy "tuba_aulas_select_publicadas" on public.tuba_aulas
  for select using (publicada = true or public.tuba_is_admin(auth.uid()));

drop policy if exists "tuba_aulas_admin_all" on public.tuba_aulas;
create policy "tuba_aulas_admin_all" on public.tuba_aulas
  for all using (public.tuba_is_admin(auth.uid())) with check (public.tuba_is_admin(auth.uid()));

-- tuba_aula_materiais
drop policy if exists "tuba_aula_materiais_select" on public.tuba_aula_materiais;
create policy "tuba_aula_materiais_select" on public.tuba_aula_materiais
  for select using (
    exists(select 1 from public.tuba_aulas a where a.id = aula_id and (a.publicada = true or public.tuba_is_admin(auth.uid())))
  );

drop policy if exists "tuba_aula_materiais_admin_all" on public.tuba_aula_materiais;
create policy "tuba_aula_materiais_admin_all" on public.tuba_aula_materiais
  for all using (public.tuba_is_admin(auth.uid())) with check (public.tuba_is_admin(auth.uid()));

-- tuba_aulas_assistidas
drop policy if exists "tuba_aulas_assistidas_select_self" on public.tuba_aulas_assistidas;
create policy "tuba_aulas_assistidas_select_self" on public.tuba_aulas_assistidas
  for select using (auth.uid() = user_id or public.tuba_is_admin(auth.uid()));

drop policy if exists "tuba_aulas_assistidas_insert_self" on public.tuba_aulas_assistidas;
create policy "tuba_aulas_assistidas_insert_self" on public.tuba_aulas_assistidas
  for insert with check (auth.uid() = user_id);

drop policy if exists "tuba_aulas_assistidas_delete_self" on public.tuba_aulas_assistidas;
create policy "tuba_aulas_assistidas_delete_self" on public.tuba_aulas_assistidas
  for delete using (auth.uid() = user_id);

-- tuba_simulados
drop policy if exists "tuba_simulados_select_publicados" on public.tuba_simulados;
create policy "tuba_simulados_select_publicados" on public.tuba_simulados
  for select using (publicado = true or public.tuba_is_admin(auth.uid()));

drop policy if exists "tuba_simulados_admin_all" on public.tuba_simulados;
create policy "tuba_simulados_admin_all" on public.tuba_simulados
  for all using (public.tuba_is_admin(auth.uid())) with check (public.tuba_is_admin(auth.uid()));

-- tuba_questoes
drop policy if exists "tuba_questoes_select" on public.tuba_questoes;
create policy "tuba_questoes_select" on public.tuba_questoes
  for select using (
    exists(select 1 from public.tuba_simulados s where s.id = simulado_id and (s.publicado = true or public.tuba_is_admin(auth.uid())))
  );

drop policy if exists "tuba_questoes_admin_all" on public.tuba_questoes;
create policy "tuba_questoes_admin_all" on public.tuba_questoes
  for all using (public.tuba_is_admin(auth.uid())) with check (public.tuba_is_admin(auth.uid()));

-- tuba_tentativas
drop policy if exists "tuba_tentativas_select_self" on public.tuba_tentativas;
create policy "tuba_tentativas_select_self" on public.tuba_tentativas
  for select using (auth.uid() = user_id or public.tuba_is_admin(auth.uid()));

drop policy if exists "tuba_tentativas_insert_self" on public.tuba_tentativas;
create policy "tuba_tentativas_insert_self" on public.tuba_tentativas
  for insert with check (auth.uid() = user_id);

drop policy if exists "tuba_tentativas_update_self" on public.tuba_tentativas;
create policy "tuba_tentativas_update_self" on public.tuba_tentativas
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- tuba_respostas
drop policy if exists "tuba_respostas_select_self" on public.tuba_respostas;
create policy "tuba_respostas_select_self" on public.tuba_respostas
  for select using (
    exists(select 1 from public.tuba_tentativas t where t.id = tentativa_id and (t.user_id = auth.uid() or public.tuba_is_admin(auth.uid())))
  );

drop policy if exists "tuba_respostas_insert_self" on public.tuba_respostas;
create policy "tuba_respostas_insert_self" on public.tuba_respostas
  for insert with check (
    exists(select 1 from public.tuba_tentativas t where t.id = tentativa_id and t.user_id = auth.uid())
  );

drop policy if exists "tuba_respostas_update_self" on public.tuba_respostas;
create policy "tuba_respostas_update_self" on public.tuba_respostas
  for update using (
    exists(select 1 from public.tuba_tentativas t where t.id = tentativa_id and t.user_id = auth.uid())
  );

-- tuba_conquistas
drop policy if exists "tuba_conquistas_select_all" on public.tuba_conquistas;
create policy "tuba_conquistas_select_all" on public.tuba_conquistas
  for select using (auth.role() = 'authenticated');

drop policy if exists "tuba_conquistas_admin_all" on public.tuba_conquistas;
create policy "tuba_conquistas_admin_all" on public.tuba_conquistas
  for all using (public.tuba_is_admin(auth.uid())) with check (public.tuba_is_admin(auth.uid()));

-- tuba_usuario_conquistas
drop policy if exists "tuba_usuario_conquistas_select_all" on public.tuba_usuario_conquistas;
create policy "tuba_usuario_conquistas_select_all" on public.tuba_usuario_conquistas
  for select using (auth.role() = 'authenticated');

drop policy if exists "tuba_usuario_conquistas_admin" on public.tuba_usuario_conquistas;
create policy "tuba_usuario_conquistas_admin" on public.tuba_usuario_conquistas
  for all using (public.tuba_is_admin(auth.uid())) with check (public.tuba_is_admin(auth.uid()));
