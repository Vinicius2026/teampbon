-- ============================================================
-- CORRIGIR TRIGGER PARA NÃO SOBRESCREVER DIAS_ADICIONAIS
-- ============================================================
-- O trigger calcular_expiracao_update está recalculando a data_expiracao
-- automaticamente, sobrescrevendo os valores quando adicionamos dias.
-- Vamos modificar o trigger para respeitar quando data_expiracao é definida explicitamente.

-- ============================================================
-- PASSO 1: Ver função atual do trigger
-- ============================================================
-- Execute para ver a função atual:
-- SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'trigger_calcular_expiracao';

-- ============================================================
-- PASSO 2: Criar função corrigida do trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.trigger_calcular_expiracao()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se data_expiracao está sendo definida explicitamente no UPDATE,
  -- NÃO recalcular - respeitar o valor fornecido
  -- Isso permite que o admin defina manualmente a data ao adicionar dias
  
  -- Para INSERT: sempre calcular se não foi fornecido
  IF TG_OP = 'INSERT' THEN
    IF NEW.data_expiracao IS NULL AND NEW.dias_acesso IS NOT NULL THEN
      -- Calcular a partir da data de criação ou hoje
      IF NEW.created_at IS NOT NULL THEN
        NEW.data_expiracao := (NEW.created_at::date + coalesce(NEW.dias_acesso, 30) + coalesce(NEW.dias_adicionais, 0));
      ELSE
        NEW.data_expiracao := (current_date + coalesce(NEW.dias_acesso, 30) + coalesce(NEW.dias_adicionais, 0));
      END IF;
    ELSIF NEW.data_expiracao IS NULL AND NEW.dias_acesso IS NULL THEN
      -- Se não tem nenhum dos dois, calcular padrão
      IF NEW.created_at IS NOT NULL THEN
        NEW.data_expiracao := (NEW.created_at::date + 30 + coalesce(NEW.dias_adicionais, 0));
      ELSE
        NEW.data_expiracao := (current_date + 30 + coalesce(NEW.dias_adicionais, 0));
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  
  -- Para UPDATE: só recalcular se data_expiracao não está sendo definida explicitamente
  IF TG_OP = 'UPDATE' THEN
    -- Se data_expiracao está sendo definida no NEW (não é NULL e mudou),
    -- significa que foi definida explicitamente - NÃO recalcular
    IF NEW.data_expiracao IS NOT NULL AND (OLD.data_expiracao IS DISTINCT FROM NEW.data_expiracao) THEN
      -- Data foi definida explicitamente - manter como está
      RETURN NEW;
    END IF;
    
    -- Se dias_adicionais mudou mas data_expiracao não foi definida explicitamente,
    -- recalcular baseado na data_expiracao atual (não na data de criação)
    IF (OLD.dias_adicionais IS DISTINCT FROM NEW.dias_adicionais) AND NEW.data_expiracao IS NOT NULL THEN
      -- Adicionar a diferença de dias à data_expiracao atual
      DECLARE
        diferenca_dias integer;
      BEGIN
        diferenca_dias := coalesce(NEW.dias_adicionais, 0) - coalesce(OLD.dias_adicionais, 0);
        NEW.data_expiracao := NEW.data_expiracao + diferenca_dias;
        RETURN NEW;
      END;
    END IF;
    
    -- Se dias_acesso mudou mas data_expiracao não foi definida explicitamente,
    -- recalcular baseado na data de criação
    IF (OLD.dias_acesso IS DISTINCT FROM NEW.dias_acesso) AND NEW.data_expiracao IS NULL THEN
      IF NEW.created_at IS NOT NULL THEN
        NEW.data_expiracao := (NEW.created_at::date + coalesce(NEW.dias_acesso, 30) + coalesce(NEW.dias_adicionais, 0));
      ELSE
        NEW.data_expiracao := (current_date + coalesce(NEW.dias_acesso, 30) + coalesce(NEW.dias_adicionais, 0));
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================
-- PASSO 3: Verificar se os triggers estão ativos
-- ============================================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'consultoria_cadastros';

-- ============================================================
-- PASSO 4: Se necessário, recriar os triggers
-- ============================================================
-- Os triggers já devem estar criados, mas vamos garantir:
DROP TRIGGER IF EXISTS calcular_expiracao_insert ON public.consultoria_cadastros;
CREATE TRIGGER calcular_expiracao_insert
BEFORE INSERT ON public.consultoria_cadastros
FOR EACH ROW
EXECUTE FUNCTION public.trigger_calcular_expiracao();

DROP TRIGGER IF EXISTS calcular_expiracao_update ON public.consultoria_cadastros;
CREATE TRIGGER calcular_expiracao_update
BEFORE UPDATE ON public.consultoria_cadastros
FOR EACH ROW
EXECUTE FUNCTION public.trigger_calcular_expiracao();

-- ============================================================
-- TESTE: Verificar se funciona
-- ============================================================
-- Teste manual (substitua [ID] pelo ID de um usuário de teste):
-- UPDATE public.consultoria_cadastros 
-- SET dias_adicionais = 5, data_expiracao = '2025-12-17'
-- WHERE id = [ID]
-- RETURNING id, dias_adicionais, data_expiracao;
-- 
-- Verifique se os valores foram salvos corretamente:
-- SELECT id, dias_adicionais, data_expiracao 
-- FROM public.consultoria_cadastros 
-- WHERE id = [ID];

