-- ============================================================
-- SOLUÇÃO DEFINITIVA: Políticas RLS para orientacoes_expert
-- ============================================================
-- Esta solução usa uma função helper que verifica o role de múltiplas formas
-- garantindo compatibilidade com diferentes configurações de JWT

-- ============================================================
-- PASSO 1: Criar função helper para verificar admin
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
  
  -- Tentar obter role direto do JWT (primeira tentativa)
  v_role := auth.jwt() ->> 'role';
  
  -- Se não encontrou, verificar na tabela auth.users
  if v_role is null or v_role != 'admin' then
    select raw_app_meta_data->>'role' into v_role
    from auth.users
    where id = v_user_id;
  end if;
  
  -- Retornar true apenas se for admin
  return coalesce(v_role, '') = 'admin';
end;
$$;

-- Garantir que a função é acessível
grant execute on function public.is_admin_user() to authenticated;

-- ============================================================
-- PASSO 2: Remover políticas antigas
-- ============================================================

drop policy if exists "user_read_own_messages" on public.orientacoes_expert;
drop policy if exists "user_update_own_messages" on public.orientacoes_expert;
drop policy if exists "admin_read_all_messages" on public.orientacoes_expert;
drop policy if exists "admin_insert_messages" on public.orientacoes_expert;
drop policy if exists "admin_update_all_messages" on public.orientacoes_expert;

-- ============================================================
-- PASSO 3: Criar políticas de usuário
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
-- PASSO 4: Criar políticas de admin usando a função helper
-- ============================================================

-- Policy: Admin pode ler todas as mensagens
create policy "admin_read_all_messages"
on public.orientacoes_expert
for select
to authenticated
using (public.is_admin_user());

-- Policy: Admin pode inserir mensagens para qualquer usuário
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
-- PASSO 5: Verificar se as políticas foram criadas
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
-- TESTE: Verificar se a função está funcionando
-- ============================================================
-- Execute este SELECT após fazer login como admin:
-- SELECT public.is_admin_user() as is_admin;

