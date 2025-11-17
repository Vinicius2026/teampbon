-- ============================================================
-- SISTEMA DE DIETAS - ADMIN ENVIA DIETAS PARA USUÁRIOS
-- ============================================================

-- 1) Criar tabela de dietas
CREATE TABLE IF NOT EXISTS public.dietas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Conteúdo das refeições
  liquido text,
  refeicao_1_acordar text,
  refeicao_2_almoco text,
  refeicao_3_lanche_tarde text,
  refeicao_4_janta text,
  
  -- Controle
  enviado_por uuid REFERENCES auth.users(id), -- ID do admin que enviou
  enviado_em timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2) Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_dietas_user_id ON public.dietas(user_id);
CREATE INDEX IF NOT EXISTS idx_dietas_enviado_em ON public.dietas(enviado_em DESC);

-- 3) Habilitar RLS
ALTER TABLE public.dietas ENABLE ROW LEVEL SECURITY;

-- 4) Policy: Usuário pode ler apenas suas próprias dietas
CREATE POLICY "user_read_own_dietas"
ON public.dietas
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 5) Policy: Admin pode ler todas as dietas
CREATE POLICY "admin_read_all_dietas"
ON public.dietas
FOR SELECT
TO authenticated
USING (public.is_admin_user());

-- 6) Policy: Admin pode inserir dietas
CREATE POLICY "admin_insert_dietas"
ON public.dietas
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user());

-- 7) Policy: Admin pode atualizar dietas
CREATE POLICY "admin_update_dietas"
ON public.dietas
FOR UPDATE
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- 8) Policy: Admin pode deletar dietas
CREATE POLICY "admin_delete_dietas"
ON public.dietas
FOR DELETE
TO authenticated
USING (public.is_admin_user());

-- 9) Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_dietas_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 10) Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_dietas_updated_at ON public.dietas;
CREATE TRIGGER update_dietas_updated_at
BEFORE UPDATE ON public.dietas
FOR EACH ROW
EXECUTE FUNCTION public.update_dietas_updated_at();

-- 11) Garantir que função is_admin_user existe
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
-- COMENTÁRIOS
-- ============================================================
COMMENT ON TABLE public.dietas IS 'Dietas enviadas pelos administradores para os usuários';
COMMENT ON COLUMN public.dietas.liquido IS 'Informações sobre líquidos (água, sucos, etc)';
COMMENT ON COLUMN public.dietas.refeicao_1_acordar IS 'Refeição 1 - Ao acordar';
COMMENT ON COLUMN public.dietas.refeicao_2_almoco IS 'Refeição 2 - Almoço';
COMMENT ON COLUMN public.dietas.refeicao_3_lanche_tarde IS 'Refeição 3 - Lanche da tarde';
COMMENT ON COLUMN public.dietas.refeicao_4_janta IS 'Refeição 4 - Janta';

