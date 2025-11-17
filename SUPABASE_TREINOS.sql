-- ============================================================
-- SISTEMA DE TREINOS - ADMIN ENVIA TREINOS PARA USUÁRIOS
-- ============================================================

-- 1) Criar tabela de treinos
CREATE TABLE IF NOT EXISTS public.treinos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Explicações gerais
  explicacao_repeticoes text,
  explicacao_series text DEFAULT 'AQ = aquecimento – RC = reconhecimento de carga – ST = série de trabalho',
  tempo_descanso text,
  progressao_carga text,
  
  -- Treinos por dia
  treino_a_dia text DEFAULT 'Segunda-feira',
  treino_a_tipo text CHECK (treino_a_tipo IN ('Push', 'Pull', 'Lower', 'Upper')),
  treino_a_conteudo text,
  
  treino_b_dia text DEFAULT 'Terça-feira',
  treino_b_tipo text CHECK (treino_b_tipo IN ('Push', 'Pull', 'Lower', 'Upper')),
  treino_b_conteudo text,
  
  treino_c_dia text DEFAULT 'Quarta-feira',
  treino_c_tipo text CHECK (treino_c_tipo IN ('Push', 'Pull', 'Lower', 'Upper')),
  treino_c_conteudo text,
  
  treino_d_dia text DEFAULT 'Sexta-feira',
  treino_d_tipo text CHECK (treino_d_tipo IN ('Push', 'Pull', 'Lower', 'Upper')),
  treino_d_conteudo text,
  
  treino_e_dia text DEFAULT 'Sábado',
  treino_e_tipo text CHECK (treino_e_tipo IN ('Push', 'Pull', 'Lower', 'Upper')),
  treino_e_conteudo text,
  
  -- Controle
  enviado_por uuid REFERENCES auth.users(id), -- ID do admin que enviou
  enviado_em timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2) Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_treinos_user_id ON public.treinos(user_id);
CREATE INDEX IF NOT EXISTS idx_treinos_enviado_em ON public.treinos(enviado_em DESC);

-- 3) Habilitar RLS
ALTER TABLE public.treinos ENABLE ROW LEVEL SECURITY;

-- 4) Policy: Usuário pode ler apenas seus próprios treinos
CREATE POLICY "user_read_own_treinos"
ON public.treinos
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 5) Policy: Admin pode ler todas os treinos
CREATE POLICY "admin_read_all_treinos"
ON public.treinos
FOR SELECT
TO authenticated
USING (public.is_admin_user());

-- 6) Policy: Admin pode inserir treinos
CREATE POLICY "admin_insert_treinos"
ON public.treinos
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user());

-- 7) Policy: Admin pode atualizar treinos
CREATE POLICY "admin_update_treinos"
ON public.treinos
FOR UPDATE
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- 8) Policy: Admin pode deletar treinos
CREATE POLICY "admin_delete_treinos"
ON public.treinos
FOR DELETE
TO authenticated
USING (public.is_admin_user());

-- 9) Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_treinos_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 10) Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_treinos_updated_at ON public.treinos;
CREATE TRIGGER update_treinos_updated_at
BEFORE UPDATE ON public.treinos
FOR EACH ROW
EXECUTE FUNCTION public.update_treinos_updated_at();

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
COMMENT ON TABLE public.treinos IS 'Treinos enviados pelos administradores para os usuários';
COMMENT ON COLUMN public.treinos.explicacao_repeticoes IS 'Explicação sobre o número de repetições';
COMMENT ON COLUMN public.treinos.explicacao_series IS 'Explicação sobre as séries (AQ, RC, ST)';
COMMENT ON COLUMN public.treinos.tempo_descanso IS 'Tempo de descanso entre séries';
COMMENT ON COLUMN public.treinos.progressao_carga IS 'Progressão de carga';
COMMENT ON COLUMN public.treinos.treino_a_tipo IS 'Tipo do treino A: Push, Pull, Lower ou Upper';
COMMENT ON COLUMN public.treinos.treino_b_tipo IS 'Tipo do treino B: Push, Pull, Lower ou Upper';
COMMENT ON COLUMN public.treinos.treino_c_tipo IS 'Tipo do treino C: Push, Pull, Lower ou Upper';
COMMENT ON COLUMN public.treinos.treino_d_tipo IS 'Tipo do treino D: Push, Pull, Lower ou Upper';
COMMENT ON COLUMN public.treinos.treino_e_tipo IS 'Tipo do treino E: Push, Pull, Lower ou Upper';

