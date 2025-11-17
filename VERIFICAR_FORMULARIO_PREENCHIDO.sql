-- ============================================================
-- SCRIPT PARA VERIFICAR SE FORMULÁRIOS ESTÃO SENDO DETECTADOS COMO PREENCHIDOS
-- ============================================================

-- 1. Verificar se há registros na tabela acompanhamento_semanal
SELECT 
  id,
  user_id,
  formulario_numero,
  data_preenchimento,
  data_desbloqueio,
  created_at
FROM public.acompanhamento_semanal
ORDER BY user_id, formulario_numero;

-- 2. Listar user_ids que têm registros de acompanhamento
-- Use um dos user_ids retornados nas próximas queries
SELECT DISTINCT 
  user_id,
  COUNT(*) as total_formularios
FROM public.acompanhamento_semanal
WHERE formulario_numero IS NOT NULL
GROUP BY user_id
ORDER BY total_formularios DESC;

-- 3. Testar a função formularios_disponiveis para TODOS os usuários que têm formulários
-- Esta query testa a função para todos os user_ids encontrados na query anterior
SELECT 
  a.user_id,
  f.formulario_numero,
  f.preenchido,
  f.data_preenchimento,
  f.pode_preencher,
  f.desbloqueado,
  f.data_desbloqueio
FROM (
  SELECT DISTINCT user_id
  FROM public.acompanhamento_semanal
  WHERE formulario_numero IS NOT NULL
) a
CROSS JOIN LATERAL public.formularios_disponiveis(a.user_id) f
ORDER BY a.user_id, f.formulario_numero;

-- 4. Testar a função formularios_disponiveis para um usuário específico
-- INSTRUÇÃO: Execute a query 2 primeiro para ver os user_ids disponíveis
-- Depois, descomente a linha abaixo e substitua 'UUID_AQUI' por um user_id real
-- SELECT * FROM public.formularios_disponiveis('UUID_AQUI') ORDER BY formulario_numero;

-- 5. Verificar diretamente na tabela se existe registro
SELECT 
  a.*,
  c.nome_completo,
  c.email
FROM public.acompanhamento_semanal a
LEFT JOIN public.consultoria_cadastros c ON c.user_id = a.user_id
WHERE a.formulario_numero IS NOT NULL
ORDER BY a.user_id, a.formulario_numero;

-- 6. Verificar se há problema com NULL no formulario_numero
SELECT 
  COUNT(*) as total_registros,
  COUNT(formulario_numero) as com_formulario_numero,
  COUNT(*) FILTER (WHERE formulario_numero IS NULL) as sem_formulario_numero
FROM public.acompanhamento_semanal;

-- 7. Verificar constraint única
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'public.acompanhamento_semanal'::regclass
  AND conname LIKE '%formulario%';

-- 8. Verificar índices
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'acompanhamento_semanal'
  AND schemaname = 'public';

