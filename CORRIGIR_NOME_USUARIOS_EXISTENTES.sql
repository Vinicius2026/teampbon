-- ============================================================
-- CORRIGIR NOMES DE USUÁRIOS EXISTENTES
-- ============================================================
-- Este script atualiza usuários existentes que não têm nome_completo
-- na tabela consultoria_cadastros, copiando do user_metadata

-- 1) Verificar usuários que precisam ser atualizados
SELECT 
  u.id as user_id,
  u.email,
  u.raw_user_meta_data->>'nome_completo' as metadata_nome,
  c.id as cadastro_id,
  c.nome_completo as tabela_nome_antes,
  c.user_id,
  CASE 
    WHEN c.nome_completo IS NOT NULL AND c.nome_completo != '' THEN 'OK'
    WHEN u.raw_user_meta_data->>'nome_completo' IS NOT NULL AND u.raw_user_meta_data->>'nome_completo' != '' THEN 'PRECISA ATUALIZAR'
    ELSE 'SEM NOME'
  END as status
FROM auth.users u
LEFT JOIN public.consultoria_cadastros c ON c.user_id = u.id
WHERE (u.raw_app_meta_data->>'role')::text = 'consultoria'
ORDER BY u.created_at DESC;

-- 2) Atualizar nome_completo na tabela consultoria_cadastros a partir do user_metadata
-- (Para usuários que foram criados pelo admin mas o nome não foi salvo na tabela)
UPDATE public.consultoria_cadastros c
SET nome_completo = u.raw_user_meta_data->>'nome_completo'
FROM auth.users u
WHERE c.user_id = u.id
  AND (c.nome_completo IS NULL OR c.nome_completo = '')
  AND u.raw_user_meta_data->>'nome_completo' IS NOT NULL
  AND u.raw_user_meta_data->>'nome_completo' != '';

-- 3) Verificar resultado após atualização
SELECT 
  u.id as user_id,
  u.email,
  u.raw_user_meta_data->>'nome_completo' as metadata_nome,
  c.id as cadastro_id,
  c.nome_completo as tabela_nome_depois,
  c.user_id,
  CASE 
    WHEN c.nome_completo IS NOT NULL AND c.nome_completo != '' THEN '✅ OK'
    WHEN u.raw_user_meta_data->>'nome_completo' IS NOT NULL AND u.raw_user_meta_data->>'nome_completo' != '' THEN '⚠️ Nome no metadata mas não na tabela'
    ELSE '❌ SEM NOME'
  END as status
FROM auth.users u
LEFT JOIN public.consultoria_cadastros c ON c.user_id = u.id
WHERE (u.raw_app_meta_data->>'role')::text = 'consultoria'
ORDER BY u.created_at DESC;

