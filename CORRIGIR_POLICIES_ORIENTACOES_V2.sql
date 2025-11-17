-- ============================================================
-- CORREÇÃO V2: Políticas RLS para orientacoes_expert
-- ============================================================
-- Vamos criar políticas mais robustas que testam múltiplas formas de verificar admin
-- Isso garante que funcionará independentemente de como o role está armazenado

-- Remover todas as políticas antigas
drop policy if exists "user_read_own_messages" on public.orientacoes_expert;
drop policy if exists "user_update_own_messages" on public.orientacoes_expert;
drop policy if exists "admin_read_all_messages" on public.orientacoes_expert;
drop policy if exists "admin_insert_messages" on public.orientacoes_expert;
drop policy if exists "admin_update_all_messages" on public.orientacoes_expert;

-- ============================================================
-- FUNÇÃO AUXILIAR: Verificar se usuário é admin
-- ============================================================
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
stable
as $$
declare
  v_role text;
  v_app_meta_role text;
begin
  -- Tentar obter role direto do JWT
  v_role := auth.jwt() ->> 'role';
  
  -- Se não encontrou, tentar de app_metadata
  if v_role is null then
    v_app_meta_role := (auth.jwt() -> 'app_metadata')::jsonb ->> 'role';
    v_role := v_app_meta_role;
  end if;
  
  -- Se ainda não encontrou, verificar na tabela auth.users
  if v_role is null then
    select raw_app_meta_data->>'role' into v_role
    from auth.users
    where id = auth.uid();
  end if;
  
  return coalesce(v_role, '') = 'admin';
end;
$$;

-- ============================================================
-- POLÍTICAS DE USUÁRIO
-- ============================================================

-- Policy: Usuário pode ler apenas suas próprias mensagens
create policy "user_read_own_messages"
on public.orientacoes_expert
for select
to authenticated
using (auth.uid() = user_id);

-- Policy: Usuário pode atualizar apenas suas próprias mensagens (para marcar como lido)
create policy "user_update_own_messages"
on public.orientacoes_expert
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ============================================================
-- POLÍTICAS DE ADMIN
-- ============================================================

-- Policy: Admin pode ler todas as mensagens
create policy "admin_read_all_messages"
on public.orientacoes_expert
for select
to authenticated
using (public.is_admin());

-- Policy: Admin pode inserir mensagens para qualquer usuário
create policy "admin_insert_messages"
on public.orientacoes_expert
for insert
to authenticated
with check (public.is_admin());

-- Policy: Admin pode atualizar qualquer mensagem
create policy "admin_update_all_messages"
on public.orientacoes_expert
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================
grant usage on schema public to authenticated;
grant execute on function public.is_admin() to authenticated;

