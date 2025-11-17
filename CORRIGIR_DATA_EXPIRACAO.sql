-- ============================================================
-- CORRIGIR DATA DE EXPIRAÇÃO PARA REGISTROS EXISTENTES
-- ============================================================
-- Este script calcula e atualiza a data de expiração para registros
-- que têm dias_acesso definido mas não têm data_expiracao

-- Atualizar registros que têm dias_acesso mas não têm data_expiracao
-- Calcular baseado em: created_at + dias_acesso + dias_adicionais
-- Se não tiver created_at, usar current_date
update public.consultoria_cadastros
set data_expiracao = (
  case 
    when created_at is not null then
      -- Calcular a partir da data de criação + dias_acesso + dias_adicionais
      (created_at::date + coalesce(dias_acesso, 30) + coalesce(dias_adicionais, 0))
    else
      -- Se não tem created_at, calcular a partir de hoje
      (current_date + coalesce(dias_acesso, 30) + coalesce(dias_adicionais, 0))
  end
)
where (data_expiracao is null or data_expiracao < created_at::date)
  and (dias_acesso is not null or dias_adicionais is not null);

-- Atualizar registros que não têm dias_acesso mas têm user_id
-- Definir 30 dias padrão e calcular data de expiração
update public.consultoria_cadastros
set 
  dias_acesso = 30,
  dias_adicionais = coalesce(dias_adicionais, 0),
  data_expiracao = (
    case 
      when created_at is not null then
        (created_at::date + 30 + coalesce(dias_adicionais, 0))
      else
        (current_date + 30 + coalesce(dias_adicionais, 0))
    end
  )
where user_id is not null
  and (dias_acesso is null or data_expiracao is null);

-- Verificar e corrigir datas de expiração que estão no passado mas o acesso não deveria estar expirado
-- Se created_at + dias_acesso + dias_adicionais > current_date, atualizar data_expiracao
update public.consultoria_cadastros
set data_expiracao = (
  case 
    when created_at is not null then
      (created_at::date + coalesce(dias_acesso, 30) + coalesce(dias_adicionais, 0))
    else
      (current_date + coalesce(dias_acesso, 30) + coalesce(dias_adicionais, 0))
  end
)
where user_id is not null
  and data_expiracao is not null
  and data_expiracao < current_date
  and (
    case 
      when created_at is not null then
        (created_at::date + coalesce(dias_acesso, 30) + coalesce(dias_adicionais, 0)) > current_date
      else
        false
    end
  );

-- Comentário final
comment on column public.consultoria_cadastros.data_expiracao is 'Data de expiração do acesso. Calculada automaticamente como: created_at + dias_acesso + dias_adicionais. Se created_at não existir, usa current_date.';

