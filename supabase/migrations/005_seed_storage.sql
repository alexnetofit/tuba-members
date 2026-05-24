-- ============================================================
-- 005_seed_storage.sql
-- disciplinas iniciais + storage buckets + policies
-- ============================================================

-- Disciplinas iniciais (matérias do concurso militar)
insert into public.tuba_disciplinas (nome, slug, cor, icone, ordem) values
  ('Português',                 'portugues',                '#d4a44a', 'BookOpen',   1),
  ('Inglês',                    'ingles',                   '#c89234', 'Languages',  2),
  ('Matemática',                'matematica',               '#b58220', 'Calculator', 3),
  ('Física',                    'fisica',                   '#a67410', 'Atom',       4),
  ('Legislação Militar',        'legislacao-militar',       '#a67410', 'Shield',     5),
  ('Serviços Administrativos',  'servicos-administrativos', '#8b5e0a', 'Briefcase',  6)
on conflict (slug) do nothing;

-- Storage buckets
insert into storage.buckets (id, name, public) values
  ('tuba-materiais', 'tuba-materiais', false),
  ('tuba-simulados-pdf', 'tuba-simulados-pdf', false),
  ('tuba-avatars', 'tuba-avatars', true)
on conflict (id) do nothing;

-- Storage policies
drop policy if exists "tuba_materiais_read_auth" on storage.objects;
create policy "tuba_materiais_read_auth" on storage.objects for select
  using (bucket_id = 'tuba-materiais' and auth.role() = 'authenticated');

drop policy if exists "tuba_materiais_admin_write" on storage.objects;
create policy "tuba_materiais_admin_write" on storage.objects for all
  using (bucket_id = 'tuba-materiais' and public.tuba_is_admin(auth.uid()))
  with check (bucket_id = 'tuba-materiais' and public.tuba_is_admin(auth.uid()));

drop policy if exists "tuba_simulados_pdf_admin" on storage.objects;
create policy "tuba_simulados_pdf_admin" on storage.objects for all
  using (bucket_id = 'tuba-simulados-pdf' and public.tuba_is_admin(auth.uid()))
  with check (bucket_id = 'tuba-simulados-pdf' and public.tuba_is_admin(auth.uid()));

drop policy if exists "tuba_avatars_write_self" on storage.objects;
create policy "tuba_avatars_write_self" on storage.objects for insert
  with check (bucket_id = 'tuba-avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "tuba_avatars_update_self" on storage.objects;
create policy "tuba_avatars_update_self" on storage.objects for update
  using (bucket_id = 'tuba-avatars' and auth.uid()::text = (storage.foldername(name))[1]);
