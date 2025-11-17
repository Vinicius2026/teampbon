-- ============================================================
-- VERIFICAR E CORRIGIR RLS PARA UPDATE DE DIAS_ADICIONAIS
-- ============================================================
-- Este script verifica se o admin tem permissão para atualizar
-- dias_adicionais e data_expiracao na tabela consultoria_cadastros

-- ============================================================
-- PASSO 1: Verificar policies existentes
-- ============================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'consultoria_cadastros'
ORDER BY policyname;

-- ============================================================
-- PASSO 2: Garantir função is_admin_user existe
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role text;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT raw_app_meta_data->>'role' INTO v_role
  FROM auth.users
  WHERE id = v_user_id;
  
  RETURN coalesce(v_role, '') = 'admin';
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

-- ============================================================
-- PASSO 3: Remover policies antigas que podem estar bloqueando
-- ============================================================
DROP POLICY IF EXISTS "allow_admin_update" ON public.consultoria_cadastros;
DROP POLICY IF EXISTS "user_update_own_cadastro" ON public.consultoria_cadastros;

-- ============================================================
-- PASSO 4: Criar policy de UPDATE usando função is_admin_user
-- ============================================================
CREATE POLICY "admin_update_cadastros"
ON public.consultoria_cadastros
FOR UPDATE
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- ============================================================
-- PASSO 5: Verificar se trigger está interferindo
-- ============================================================
-- Se houver um trigger que recalcula data_expiracao automaticamente,
-- ele pode estar sobrescrevendo o valor que estamos tentando salvar.
-- Vamos verificar se existe trigger:
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'consultoria_cadastros';

-- ============================================================
-- PASSO 6: Se necessário, desabilitar temporariamente o trigger
-- ============================================================
-- Se o trigger calcular_expiracao_update estiver interferindo,
-- podemos desabilitá-lo temporariamente:
-- ALTER TABLE public.consultoria_cadastros DISABLE TRIGGER calcular_expiracao_update;

-- Ou modificar o trigger para não recalcular quando data_expiracao já está definida:
-- (Isso requer modificar a função trigger_calcular_expiracao)

-- ============================================================
-- TESTE: Verificar se admin consegue fazer update
-- ============================================================
-- Execute como admin autenticado:
-- UPDATE public.consultoria_cadastros 
-- SET dias_adicionais = 5, data_expiracao = '2025-12-17'
-- WHERE id = [ID_DO_USUARIO_TESTE]
-- RETURNING id, dias_adicionais, data_expiracao;

