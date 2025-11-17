-- ============================================================
-- VERIFICAR JWT DO ADMIN
-- ============================================================
-- Execute este SQL DEPOIS de fazer login como admin no sistema
-- Isso vai mostrar como o role está armazenado no JWT

-- Verificar o role no JWT
select 
  auth.uid() as user_id,
  auth.jwt() ->> 'role' as jwt_role_direct,
  auth.jwt() ->> 'app_metadata' as jwt_app_metadata,
  (auth.jwt() -> 'app_metadata')::jsonb ->> 'role' as jwt_app_metadata_role,
  auth.jwt() as full_jwt;

-- Verificar se o usuário atual tem role admin na tabela auth.users
select 
  u.id,
  u.email,
  u.raw_app_meta_data->>'role' as raw_app_meta_role,
  u.raw_user_meta_data->>'role' as raw_user_meta_role
from auth.users u
where u.id = auth.uid();

