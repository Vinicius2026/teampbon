-- ============================================================
-- SISTEMA DE EXERCÍCIOS E TREINOS ESTRUTURADOS
-- ============================================================

-- 1) Criar tabela de exercícios
CREATE TABLE IF NOT EXISTS public.exercicios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- 2) Inserir todos os exercícios
INSERT INTO public.exercicios (nome) VALUES
('Crucifixo reto (com halteres)'),
('Crucifixo inclinado (com halteres)'),
('Crucifixo declinado (com halteres)'),
('Cross Over (polia alta)'),
('Cross Over (polia média)'),
('Cross Over (polia baixa)'),
('Cross Over unilateral (polia alta/média/baixa)'),
('Supino reto (com barra)'),
('Supino reto (com halteres)'),
('Supino reto (máquina Smith)'),
('Supino reto (máquina articulada)'),
('Supino inclinado (com barra)'),
('Supino inclinado (com halteres)'),
('Supino inclinado (máquina Smith)'),
('Supino inclinado (máquina articulada)'),
('Supino declinado (com barra)'),
('Supino declinado (com halteres)'),
('Supino declinado (máquina Smith)'),
('Supino fechado (Close-grip bench press)'),
('Peck Deck (Voador ou Crucifixo na máquina)'),
('Pullover (com halter, deitado no banco)'),
('Pullover (na polia alta, com corda ou barra)'),
('Flexão de braço (tradicional)'),
('Flexão de braço (inclinada, mãos no banco)'),
('Flexão de braço (declinada, pés no banco)'),
('Flexão diamante (mãos juntas)'),
('Mergulho nas paralelas (Dips, com tronco inclinado)'),
('Desenvolvimento máquina (pegada pronada / neutra)'),
('Desenvolvimento com barra (pela frente)'),
('Desenvolvimento com barra (por trás da nuca)'),
('Desenvolvimento com halteres (sentado / em pé)'),
('Desenvolvimento Arnold (Arnold Press)'),
('Elevação lateral com halteres (em pé / sentado)'),
('Elevação lateral no cabo (polia baixa, unilateral)'),
('Elevação lateral no cabo (polia baixa, bilateral)'),
('Elevação lateral curvado (para deltoide posterior)'),
('Elevação frontal com halteres (pegada pronada)'),
('Elevação frontal com halteres (pegada martelo)'),
('Elevação frontal c/ corda (na polia baixa)'),
('Elevação frontal c/ barra (na polia baixa)'),
('Elevação frontal c/ anilha'),
('Crucifixo invertido (com halteres, sentado no banco)'),
('Crucifixo invertido (na máquina Peck Deck)'),
('Crucifixo invertido (na polia alta)'),
('Puxada para o rosto (Face Pull, na polia alta)'),
('Remada alta (com barra W / barra reta / na polia baixa)'),
('Encolhimento (com halteres)'),
('Encolhimento (com barra, pegada por trás ou pela frente)'),
('Encolhimento (na máquina Smith)'),
('Tríceps unilateral no cabo (pegada neutra)'),
('Tríceps unilateral no cabo (pegada supinada / invertida)'),
('Tríceps unilateral no cabo (pegada pronada)'),
('Tríceps testa unilateral no cabo'),
('Tríceps Pulley (na polia alta, com barra reta)'),
('Tríceps Pulley (na polia alta, com barra V)'),
('Tríceps Corda (na polia alta)'),
('Tríceps Testa (com barra W, deitado)'),
('Tríceps Testa (com halteres, pegada neutra)'),
('Tríceps Testa (unilateral com halter)'),
('Tríceps Francês (com halter, sentado, bilateral)'),
('Tríceps Francês (com halter, sentado, unilateral)'),
('Tríceps Francês (na polia baixa, com corda)'),
('Tríceps Coice (unilateral com halter)'),
('Tríceps Coice (na polia baixa)'),
('Tríceps Coice (bilateral na polia baixa, com cordas)'),
('Mergulho no banco (Tríceps banco)'),
('Mergulho nas paralelas (Dips, com tronco reto)'),
('Extensão de tríceps acima da cabeça (na polia baixa)'),
('Puxada frontal (Pulldown, pegada pronada aberta)'),
('Puxada frontal (Pulldown, pegada supinada fechada)'),
('Puxada frontal (Pulldown, pegada neutra)'),
('Puxada alta nuca (Pulldown por trás)'),
('Barra fixa (Pull-up, pegada pronada)'),
('Barra fixa (Chin-up, pegada supinada)'),
('Barra fixa (pegada neutra)'),
('Remada curvada (com barra, pegada pronada)'),
('Remada curvada (com barra, pegada supinada - Yates Row)'),
('Remada unilateral com halter (Remada serrote)'),
('Remada sentada (na polia baixa, pegada V)'),
('Remada sentada (na polia baixa, barra reta)'),
('Remada cavalinho (com barra T)'),
('Remada máquina (articulada, pegada pronada / neutra)'),
('Pullover na polia alta (braços estendidos)'),
('Levantamento Terra (Deadlift, tradicional)'),
('Levantamento Terra Sumô'),
('Hiperextensão lombar (no banco 45º)'),
('Hiperextensão lombar (no banco horizontal - GHD)'),
('Agachamento livre (barra alta / barra baixa)'),
('Agachamento Hack (na máquina)'),
('Agachamento no Smith'),
('Agachamento frontal (Front Squat, com barra)'),
('Agachamento Sumô (com barra / com halter)'),
('Agachamento Búlgaro (com halteres / no Smith)'),
('Leg Press 45° (tradicional / unilateral / pés baixos / pés altos)'),
('Leg Press horizontal'),
('Cadeira extensora (unilateral / bilateral)'),
('Afundo (Avanço, com halteres / com barra)'),
('Afundo no Smith'),
('Passada (Walking Lunge)'),
('Cadeira flexora (deitada)'),
('Cadeira flexora (sentada)'),
('Mesa flexora (unilateral / bilateral)'),
('Stiff (Levantamento Terra Romeno, com barra / com halteres)'),
('Stiff unilateral'),
('Cadeira adutora'),
('Cadeira abdutora'),
('Elevação pélvica (Hip Thrust, com barra)'),
('Glúteo na polia baixa (coice)'),
('Glúteo na máquina (coice)'),
('Panturrilha em pé (gêmeos, máquina / Smith / livre)'),
('Panturrilha sentada (sóleo, máquina)'),
('Panturrilha no Leg Press'),
('Rosca direta (com barra reta)'),
('Rosca direta (com barra W)'),
('Rosca alternada (com halteres, em pé)'),
('Rosca alternada (com halteres, sentado no banco inclinado)'),
('Rosca martelo (com halteres)'),
('Rosca martelo (na polia baixa, com corda)'),
('Rosca Scott (na máquina)'),
('Rosca Scott (com barra W)'),
('Rosca Scott (com halter, unilateral)'),
('Rosca concentrada (sentado, com halter)'),
('Rosca na polia baixa (com barra reta)'),
('Rosca na polia baixa (unilateral)'),
('Rosca 21 (com barra)'),
('Rosca invertida (pegada pronada, com barra / na polia)'),
('Abdominal supra (Crunch, no solo)'),
('Abdominal supra (na máquina)'),
('Abdominal no cabo (Crunch na polia alta)'),
('Elevação de pernas (na paralela / capitão)'),
('Elevação de pernas (deitado no solo)'),
('Elevação de pernas (em suspensão na barra)'),
('Abdominal infra (no banco declinado)'),
('Rotação russa (Russian Twist, com peso ou livre)'),
('Oblíquo no cabo (rotação ou inclinação lateral)'),
('Prancha (frontal)'),
('Prancha (lateral)'),
('Roda abdominal (Ab Wheel)')
ON CONFLICT (nome) DO NOTHING;

-- 3) Habilitar extensão para busca fuzzy (se não existir)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Criar índice para busca rápida usando GiST (mais compatível)
CREATE INDEX IF NOT EXISTS idx_exercicios_nome_trgm ON public.exercicios USING gist (nome gist_trgm_ops);

-- Alternativa: índice B-tree simples para busca ILIKE (também funciona bem)
CREATE INDEX IF NOT EXISTS idx_exercicios_nome_btree ON public.exercicios (nome);

-- 4) Habilitar RLS na tabela de exercícios (todos podem ler)
ALTER TABLE public.exercicios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_read_exercicios"
ON public.exercicios
FOR SELECT
TO authenticated
USING (true);

-- 5) Modificar tabela treinos para usar JSONB para exercícios estruturados
-- Primeiro, adicionar colunas JSONB para cada treino
ALTER TABLE public.treinos 
ADD COLUMN IF NOT EXISTS treino_a_exercicios jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS treino_b_exercicios jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS treino_c_exercicios jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS treino_d_exercicios jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS treino_e_exercicios jsonb DEFAULT '[]'::jsonb;

-- Estrutura JSONB esperada:
-- [
--   {"exercicio": "Crucifixo reto (com halteres)", "serie": "AQ + RC1 + RC2 + 2 ST"},
--   {"exercicio": "Cross Over (polia alta)", "serie": "RC1 + 2 ST"},
--   ...
-- ]

-- 6) Criar índices GIN para busca em JSONB
CREATE INDEX IF NOT EXISTS idx_treinos_treino_a_exercicios ON public.treinos USING gin (treino_a_exercicios);
CREATE INDEX IF NOT EXISTS idx_treinos_treino_b_exercicios ON public.treinos USING gin (treino_b_exercicios);
CREATE INDEX IF NOT EXISTS idx_treinos_treino_c_exercicios ON public.treinos USING gin (treino_c_exercicios);
CREATE INDEX IF NOT EXISTS idx_treinos_treino_d_exercicios ON public.treinos USING gin (treino_d_exercicios);
CREATE INDEX IF NOT EXISTS idx_treinos_treino_e_exercicios ON public.treinos USING gin (treino_e_exercicios);

-- 7) Função RPC para buscar exercícios (autocomplete)
CREATE OR REPLACE FUNCTION public.buscar_exercicios(query text)
RETURNS TABLE(id uuid, nome text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.nome
  FROM public.exercicios e
  WHERE e.nome ILIKE '%' || query || '%'
  ORDER BY 
    CASE 
      WHEN e.nome ILIKE query || '%' THEN 1
      ELSE 2
    END,
    e.nome
  LIMIT 20;
END;
$$;

GRANT EXECUTE ON FUNCTION public.buscar_exercicios(text) TO authenticated;

-- ============================================================
-- COMENTÁRIOS
-- ============================================================
COMMENT ON TABLE public.exercicios IS 'Catálogo de exercícios disponíveis para autocomplete';
COMMENT ON COLUMN public.treinos.treino_a_exercicios IS 'Array JSONB com exercícios do treino A: [{"exercicio": "nome", "serie": "série"}]';
COMMENT ON COLUMN public.treinos.treino_b_exercicios IS 'Array JSONB com exercícios do treino B: [{"exercicio": "nome", "serie": "série"}]';
COMMENT ON COLUMN public.treinos.treino_c_exercicios IS 'Array JSONB com exercícios do treino C: [{"exercicio": "nome", "serie": "série"}]';
COMMENT ON COLUMN public.treinos.treino_d_exercicios IS 'Array JSONB com exercícios do treino D: [{"exercicio": "nome", "serie": "série"}]';
COMMENT ON COLUMN public.treinos.treino_e_exercicios IS 'Array JSONB com exercícios do treino E: [{"exercicio": "nome", "serie": "série"}]';

