-- ============================================================
-- CORREÇÃO COMPLETA DE POLICIES - consultoria_cadastros
-- ============================================================

-- 1) Remover policies antigas (caso existam com nomes diferentes)
drop policy if exists "admin can read cadastros" on public.consultoria_cadastros;
drop policy if exists "admin can update cadastros" on public.consultoria_cadastros;
drop policy if exists "admin can delete cadastros" on public.consultoria_cadastros;
drop policy if exists "anon insert consultoria" on public.consultoria_cadastros;
drop policy if exists "deny select consultoria" on public.consultoria_cadastros;

-- 2) Garantir que RLS está habilitado
alter table public.consultoria_cadastros enable row level security;

-- 3) Policy para INSERT por usuários anônimos (formulário público)
create policy "allow_anon_insert"
on public.consultoria_cadastros
for insert
to anon
with check (true);

-- 4) Policy para SELECT por admin autenticado
create policy "allow_admin_select"
on public.consultoria_cadastros
for select
to authenticated
using (
  (auth.jwt() ->> 'role') = 'admin'
);

-- 5) Policy para UPDATE por admin autenticado
create policy "allow_admin_update"
on public.consultoria_cadastros
for update
to authenticated
using (
  (auth.jwt() ->> 'role') = 'admin'
)
with check (
  (auth.jwt() ->> 'role') = 'admin'
);

-- 6) Policy para DELETE por admin autenticado
create policy "allow_admin_delete"
on public.consultoria_cadastros
for delete
to authenticated
using (
  (auth.jwt() ->> 'role') = 'admin'
);

-- ============================================================
-- VERIFICAR RESULTADO
-- ============================================================
-- Liste as policies criadas:
select schemaname, tablename, policyname, permissive, roles, cmd, qual
from pg_policies
where tablename = 'consultoria_cadastros';

