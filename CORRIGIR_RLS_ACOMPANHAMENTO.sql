-- ============================================================
-- CORREÇÃO: Políticas RLS para acompanhamento_semanal
-- ============================================================
-- Problema: A política admin_read_all_tracking estava usando
-- (auth.jwt() ->> 'role') = 'admin', mas o role está em app_metadata
-- Solução: Usar função is_admin_user() que verifica na tabela auth.users
-- ============================================================

-- ============================================================
-- PASSO 1: Garantir que a função is_admin_user existe
-- ============================================================

create or replace function public.is_admin_user()
returns boolean
language plpgsql
security definer
stable
as $$
declare
  v_role text;
  v_user_id uuid;
begin
  -- Obter user_id atual
  v_user_id := auth.uid();
  if v_user_id is null then
    return false;
  end if;
  
  -- Verificar role diretamente na tabela auth.users
  -- Isso é mais confiável que depender do JWT
  select raw_app_meta_data->>'role' into v_role
  from auth.users
  where id = v_user_id;
  
  -- Retornar true apenas se for admin
  return coalesce(v_role, '') = 'admin';
end;
$$;

-- Garantir que a função é acessível
grant execute on function public.is_admin_user() to authenticated;

-- ============================================================
-- PASSO 2: Remover política antiga
-- ============================================================

drop policy if exists "admin_read_all_tracking" on public.acompanhamento_semanal;

-- ============================================================
-- PASSO 3: Criar nova política usando função is_admin_user()
-- ============================================================

-- Policy: Admin pode ler todos os registros
create policy "admin_read_all_tracking"
on public.acompanhamento_semanal
for select
to authenticated
using (public.is_admin_user());

-- ============================================================
-- PASSO 4: Verificar se a política de update também precisa correção
-- ============================================================

-- Verificar se existe política de update para admin
-- Se não existir, criar uma para permitir que admin atualize admin_visualizado
drop policy if exists "admin_update_visualizado" on public.acompanhamento_semanal;

create policy "admin_update_visualizado"
on public.acompanhamento_semanal
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

-- ============================================================
-- VERIFICAÇÃO: Listar todas as políticas da tabela
-- ============================================================

-- Execute esta query para verificar se as políticas foram criadas corretamente:
-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd,
--   qual,
--   with_check
-- FROM pg_policies 
-- WHERE tablename = 'acompanhamento_semanal'
-- ORDER BY policyname;

