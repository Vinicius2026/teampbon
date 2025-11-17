-- ============================================================
-- SOLUÇÃO COMPLETA: Corrigir RLS para orientacoes_expert
-- ============================================================
-- Esta solução:
-- 1. Cria uma função que verifica role na tabela auth.users (mais confiável)
-- 2. Corrige todas as políticas RLS
-- 3. Inclui script para garantir que o admin está configurado

-- ============================================================
-- PASSO 1: Garantir que o admin tem role configurado
-- ============================================================
-- Execute este passo PRIMEIRO se o admin não estiver funcionando
-- (Substitua o email pelo email do seu admin)

-- Verificar qual é o email do admin (ajuste conforme necessário)
-- UPDATE auth.users
-- SET raw_app_meta_data = jsonb_build_object('role', 'admin'),
--     updated_at = now()
-- WHERE email = 'aurenospagamento@gmail.com';

-- ============================================================
-- PASSO 2: Criar função helper para verificar admin
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
-- PASSO 3: Remover políticas antigas
-- ============================================================

drop policy if exists "user_read_own_messages" on public.orientacoes_expert;
drop policy if exists "user_update_own_messages" on public.orientacoes_expert;
drop policy if exists "admin_read_all_messages" on public.orientacoes_expert;
drop policy if exists "admin_insert_messages" on public.orientacoes_expert;
drop policy if exists "admin_update_all_messages" on public.orientacoes_expert;

-- ============================================================
-- PASSO 4: Criar políticas de usuário
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
-- PASSO 5: Criar políticas de admin usando a função helper
-- ============================================================

-- Policy: Admin pode ler todas as mensagens
create policy "admin_read_all_messages"
on public.orientacoes_expert
for select
to authenticated
using (public.is_admin_user());

-- Policy: Admin pode inserir mensagens para qualquer usuário
-- IMPORTANTE: Esta é a política que estava falhando
create policy "admin_insert_messages"
on public.orientacoes_expert
for insert
to authenticated
with check (public.is_admin_user());

-- Policy: Admin pode atualizar qualquer mensagem
create policy "admin_update_all_messages"
on public.orientacoes_expert
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

-- ============================================================
-- PASSO 6: Verificar se tudo foi criado corretamente
-- ============================================================

-- Listar todas as políticas da tabela
select 
  policyname, 
  cmd, 
  permissive,
  roles
from pg_policies 
where tablename = 'orientacoes_expert'
order by policyname;

-- ============================================================
-- PASSO 7: Corrigir função marcar_mensagem_lida
-- ============================================================
-- Corrigir erro "operator does not exist: boolean > integer"

create or replace function public.marcar_mensagem_lida(p_mensagem_id uuid, p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_row_count integer;
begin
  update public.orientacoes_expert
  set lido = true,
      lido_em = now()
  where id = p_mensagem_id
    and user_id = p_user_id
    and lido = false;
  
  get diagnostics v_row_count = row_count;
  return v_row_count > 0;
end;
$$;

-- ============================================================
-- PASSO 8: Testar a função (execute após fazer login como admin)
-- ============================================================
-- SELECT public.is_admin_user() as is_admin;
-- Deve retornar 'true' se você for admin

-- ============================================================
-- PASSO 9: Verificar role do usuário atual
-- ============================================================
-- SELECT 
--   u.email,
--   u.raw_app_meta_data->>'role' as role,
--   auth.uid() as current_user_id
-- FROM auth.users u
-- WHERE u.id = auth.uid();

