-- ============================================================
-- Script para verificar e garantir função is_admin_user
-- ============================================================
-- Esta função é usada pelo frontend para verificar se um usuário é admin
-- Ela verifica o role diretamente na tabela auth.users

-- ============================================================
-- PASSO 1: Criar função helper para verificar admin (se não existir)
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
-- PASSO 2: Verificar se existem usuários admin
-- ============================================================

-- Listar todos os usuários e seus roles
select 
  id,
  email,
  raw_app_meta_data->>'role' as role,
  created_at
from auth.users
order by created_at desc;

-- ============================================================
-- PASSO 3: Verificar um usuário específico
-- ============================================================
-- (Substitua o email pelo email do admin)

-- select 
--   id,
--   email,
--   raw_app_meta_data->>'role' as role,
--   raw_app_meta_data as full_metadata
-- from auth.users
-- where email = 'SEU_EMAIL_ADMIN@exemplo.com';

-- ============================================================
-- PASSO 4: Atualizar role de um usuário para admin (se necessário)
-- ============================================================
-- (Descomente e ajuste o email se precisar criar/atualizar um admin)

-- UPDATE auth.users
-- SET raw_app_meta_data = jsonb_build_object('role', 'admin'),
--     updated_at = now()
-- WHERE email = 'SEU_EMAIL_ADMIN@exemplo.com';

-- ============================================================
-- PASSO 5: Testar a função (substitua o user_id)
-- ============================================================
-- (Execute esta query enquanto estiver autenticado como admin)

-- SELECT public.is_admin_user() as is_admin;

