-- ============================================================
-- ADICIONAR NOVOS CAMPOS DE TREINAMENTO
-- Executar no Supabase SQL Editor
-- ============================================================
-- IMPORTANTE: Execute este SQL no Supabase antes de usar as novas etapas do formulário
-- ============================================================

-- Etapa 8 - Informações de Treino
ALTER TABLE public.consultoria_cadastros 
ADD COLUMN IF NOT EXISTS exercicio_fisico_pratica TEXT;

ALTER TABLE public.consultoria_cadastros 
ADD COLUMN IF NOT EXISTS tempo_pratica_esporte TEXT;

ALTER TABLE public.consultoria_cadastros 
ADD COLUMN IF NOT EXISTS tipo_academia TEXT;

ALTER TABLE public.consultoria_cadastros 
ADD COLUMN IF NOT EXISTS horario_treino TEXT;

-- Etapa 9 - Detalhes de Treino
ALTER TABLE public.consultoria_cadastros 
ADD COLUMN IF NOT EXISTS musculatura_segundo_enfoque TEXT;

ALTER TABLE public.consultoria_cadastros 
ADD COLUMN IF NOT EXISTS divisao_treino_atual TEXT;

ALTER TABLE public.consultoria_cadastros 
ADD COLUMN IF NOT EXISTS exercicios_series_detalhes TEXT;

ALTER TABLE public.consultoria_cadastros 
ADD COLUMN IF NOT EXISTS limitacao_desconforto_articular TEXT;

ALTER TABLE public.consultoria_cadastros 
ADD COLUMN IF NOT EXISTS uso_esteroides TEXT;

ALTER TABLE public.consultoria_cadastros 
ADD COLUMN IF NOT EXISTS outros_esportes TEXT;

-- Etapa 10 - Maquinário da Academia
ALTER TABLE public.consultoria_cadastros 
ADD COLUMN IF NOT EXISTS aparelhos_costas JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.consultoria_cadastros 
ADD COLUMN IF NOT EXISTS aparelhos_peito JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.consultoria_cadastros 
ADD COLUMN IF NOT EXISTS frequencia_pratica TEXT;

ALTER TABLE public.consultoria_cadastros 
ADD COLUMN IF NOT EXISTS tempo_disponivel_treino TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.consultoria_cadastros.exercicio_fisico_pratica IS 'Qual exercício físico você pratica?';
COMMENT ON COLUMN public.consultoria_cadastros.tempo_pratica_esporte IS 'Há quanto tempo você pratica este esporte?';
COMMENT ON COLUMN public.consultoria_cadastros.tipo_academia IS 'Tipo de academia: Academia de bairro, Academia de rede, ou Centro de treinamento (CT)';
COMMENT ON COLUMN public.consultoria_cadastros.horario_treino IS 'Qual horário você treina?';
COMMENT ON COLUMN public.consultoria_cadastros.musculatura_segundo_enfoque IS 'Qual musculatura seria seu segundo maior enfoque em desenvolver atualmente?';
COMMENT ON COLUMN public.consultoria_cadastros.divisao_treino_atual IS 'Divisão de treino atual (ex: ABC, ABCDE, etc)';
COMMENT ON COLUMN public.consultoria_cadastros.exercicios_series_detalhes IS 'Detalhes dos exercícios e quantidade de séries';
COMMENT ON COLUMN public.consultoria_cadastros.limitacao_desconforto_articular IS 'Limitações ou desconfortos articulares';
COMMENT ON COLUMN public.consultoria_cadastros.uso_esteroides IS 'Informações sobre uso de esteroides anabolizantes';
COMMENT ON COLUMN public.consultoria_cadastros.outros_esportes IS 'Outros esportes praticados, frequência e duração';
COMMENT ON COLUMN public.consultoria_cadastros.aparelhos_costas IS 'Lista de aparelhos de costas disponíveis na academia (JSONB array)';
COMMENT ON COLUMN public.consultoria_cadastros.aparelhos_peito IS 'Lista de aparelhos de peito disponíveis na academia (JSONB array)';
COMMENT ON COLUMN public.consultoria_cadastros.frequencia_pratica IS 'Com que frequência pratica: 1x, 2x, 3x, 4x, 5x, 6x, 7x na semana';
COMMENT ON COLUMN public.consultoria_cadastros.tempo_disponivel_treino IS 'Quanto tempo disponível para treino';

-- Etapa 11 - Máquinas de Deltoide e Membros Inferiores
ALTER TABLE public.consultoria_cadastros 
ADD COLUMN IF NOT EXISTS aparelhos_deltoide JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.consultoria_cadastros 
ADD COLUMN IF NOT EXISTS aparelhos_membros_inferiores JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.consultoria_cadastros 
ADD COLUMN IF NOT EXISTS maquinas_faltando TEXT;

-- Etapa 12 - Hábitos de Vida
ALTER TABLE public.consultoria_cadastros 
ADD COLUMN IF NOT EXISTS qualidade_sono_escala TEXT;

ALTER TABLE public.consultoria_cadastros 
ADD COLUMN IF NOT EXISTS horas_sono_noite TEXT;

ALTER TABLE public.consultoria_cadastros 
ADD COLUMN IF NOT EXISTS observacao_sono TEXT;

ALTER TABLE public.consultoria_cadastros 
ADD COLUMN IF NOT EXISTS fuma_frequencia TEXT;

ALTER TABLE public.consultoria_cadastros 
ADD COLUMN IF NOT EXISTS bebidas_alcoolicas_frequencia TEXT;

-- Etapa 13 e 14 - Rotina
ALTER TABLE public.consultoria_cadastros 
ADD COLUMN IF NOT EXISTS rotina_segunda TEXT;

ALTER TABLE public.consultoria_cadastros 
ADD COLUMN IF NOT EXISTS rotina_terca TEXT;

ALTER TABLE public.consultoria_cadastros 
ADD COLUMN IF NOT EXISTS rotina_quarta TEXT;

ALTER TABLE public.consultoria_cadastros 
ADD COLUMN IF NOT EXISTS rotina_quinta TEXT;

-- Comentários para documentação (Novas Etapas)
COMMENT ON COLUMN public.consultoria_cadastros.aparelhos_deltoide IS 'Lista de aparelhos de deltoide disponíveis na academia (JSONB array)';
COMMENT ON COLUMN public.consultoria_cadastros.aparelhos_membros_inferiores IS 'Lista de aparelhos de membros inferiores disponíveis na academia (JSONB array)';
COMMENT ON COLUMN public.consultoria_cadastros.maquinas_faltando IS 'Máquinas que gostaria que estivessem no treinamento';
COMMENT ON COLUMN public.consultoria_cadastros.qualidade_sono_escala IS 'Qualidade do sono em escala de 0-10';
COMMENT ON COLUMN public.consultoria_cadastros.horas_sono_noite IS 'Horas de sono por noite em média';
COMMENT ON COLUMN public.consultoria_cadastros.observacao_sono IS 'Observações adicionais sobre o sono';
COMMENT ON COLUMN public.consultoria_cadastros.fuma_frequencia IS 'Frequência de consumo de cigarro';
COMMENT ON COLUMN public.consultoria_cadastros.bebidas_alcoolicas_frequencia IS 'Frequência de consumo de bebidas alcoólicas';
COMMENT ON COLUMN public.consultoria_cadastros.rotina_segunda IS 'Rotina detalhada da segunda-feira';
COMMENT ON COLUMN public.consultoria_cadastros.rotina_terca IS 'Rotina detalhada da terça-feira';
COMMENT ON COLUMN public.consultoria_cadastros.rotina_quarta IS 'Rotina detalhada da quarta-feira';
COMMENT ON COLUMN public.consultoria_cadastros.rotina_quinta IS 'Rotina detalhada da quinta-feira';

-- ============================================================
-- VERIFICAÇÃO
-- Execute esta query para verificar se as colunas foram criadas:
-- ============================================================
/*
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'consultoria_cadastros'
AND column_name IN (
  'exercicio_fisico_pratica',
  'tempo_pratica_esporte',
  'tipo_academia',
  'horario_treino',
  'musculatura_segundo_enfoque',
  'divisao_treino_atual',
  'exercicios_series_detalhes',
  'limitacao_desconforto_articular',
  'uso_esteroides',
  'outros_esportes',
  'aparelhos_costas',
  'aparelhos_peito',
  'frequencia_pratica',
  'tempo_disponivel_treino'
)
ORDER BY column_name;
*/
