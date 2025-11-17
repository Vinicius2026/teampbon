-- ============================================================
-- NOVO SISTEMA DE ACOMPANHAMENTO - 4 FORMULÁRIOS PROGRESSIVOS
-- ============================================================

-- Remover constraint antiga e adicionar novas colunas
alter table public.acompanhamento_semanal 
drop constraint if exists acompanhamento_semanal_user_id_semana_inicio_key;

-- Adicionar novas colunas para sistema de 4 formulários
alter table public.acompanhamento_semanal
add column if not exists formulario_numero integer check (formulario_numero between 1 and 4);

alter table public.acompanhamento_semanal
add column if not exists data_preenchimento timestamptz default now();

alter table public.acompanhamento_semanal
add column if not exists data_desbloqueio date;

-- Remover colunas antigas que não são mais necessárias
-- (mantemos semana_inicio e semana_fim para compatibilidade, mas não usaremos mais)

-- Nova constraint: 1 formulário por número por usuário
alter table public.acompanhamento_semanal
add constraint acompanhamento_formulario_unico unique(user_id, formulario_numero);

-- Índices para performance
create index if not exists idx_acompanhamento_formulario on public.acompanhamento_semanal(user_id, formulario_numero);
create index if not exists idx_acompanhamento_data_desbloqueio on public.acompanhamento_semanal(data_desbloqueio);

-- ============================================================
-- FUNÇÃO PARA CALCULAR DATA DE DESBLOQUEIO DOS FORMULÁRIOS
-- ============================================================

create or replace function public.calcular_data_desbloqueio_formulario(
  p_user_id uuid,
  p_formulario_numero integer
) returns date
language plpgsql
security definer
as $$
declare
  data_criacao date;
  data_expiracao date;
  dias_apos_criacao integer;
  data_desbloqueio date;
begin
  -- Buscar data de criação do usuário (prioridade: consultoria_cadastros.created_at, depois auth.users.created_at)
  select 
    coalesce(
      c.created_at::date,
      u.created_at::date
    ) as created_at
  into data_criacao
  from auth.users u
  left join public.consultoria_cadastros c on c.user_id = u.id
  where u.id = p_user_id
  limit 1;
  
  -- Se não encontrou data de criação, usar data atual
  if data_criacao is null then
    data_criacao := current_date;
  end if;
  
  -- Buscar data de expiração do acesso
  select data_expiracao into data_expiracao
  from public.consultoria_cadastros
  where user_id = p_user_id
  limit 1;
  
  -- Calcular dias após criação para desbloqueio
  -- Formulário 1: imediato (data de criação)
  -- Formulário 2: 2 dias após o primeiro ser preenchido (ou 2 dias após criação se primeiro não foi preenchido)
  -- Formulário 3: 2 dias após o segundo ser preenchido (ou 4 dias após criação se anteriores não foram preenchidos)
  -- Formulário 4: 2 dias após o terceiro ser preenchido (ou 6 dias após criação se anteriores não foram preenchidos)
  
  if p_formulario_numero = 1 then
    -- Primeiro formulário: desbloqueado imediatamente na data de criação
    data_desbloqueio := data_criacao;
  else
    -- Verificar quando o formulário anterior foi preenchido
    -- Se foi preenchido, usar data de preenchimento + 2 dias
    -- Se não foi preenchido, calcular baseado na data de criação + intervalo mínimo
    declare
      data_anterior_preenchimento date;
    begin
      -- Verificar se o formulário anterior foi preenchido
      select data_preenchimento::date into data_anterior_preenchimento
      from public.acompanhamento_semanal
      where user_id = p_user_id
        and formulario_numero = p_formulario_numero - 1
      limit 1;
      
      if data_anterior_preenchimento is not null then
        -- Desbloqueia 2 dias após o formulário anterior ser preenchido
        data_desbloqueio := data_anterior_preenchimento + 2;
      else
        -- Se o anterior não foi preenchido, calcular baseado na data de criação
        -- Formulário 2: mínimo 2 dias após criação
        -- Formulário 3: mínimo 4 dias após criação (mas será recalculado quando o 2 for preenchido)
        -- Formulário 4: mínimo 6 dias após criação (mas será recalculado quando o 3 for preenchido)
        data_desbloqueio := data_criacao + ((p_formulario_numero - 1) * 2);
      end if;
    end;
  end if;
  
  -- Para o formulário 1, sempre retornar a data de desbloqueio mesmo se expirado
  -- A verificação de expiração será feita na função formularios_disponiveis
  -- Isso garante que o formulário 1 sempre tenha uma data de desbloqueio calculada
  if p_formulario_numero = 1 then
    return data_desbloqueio;
  end if;
  
  -- Para outros formulários, verificar se a data de desbloqueio não ultrapassa a data de expiração
  if data_expiracao is not null and data_desbloqueio > data_expiracao then
    -- Se ultrapassar, retornar null (mas isso não deve impedir o formulário 1)
    return null;
  end if;
  
  return data_desbloqueio;
end;
$$;

-- ============================================================
-- FUNÇÃO PARA VERIFICAR FORMULÁRIOS DISPONÍVEIS
-- ============================================================

create or replace function public.formularios_disponiveis(p_user_id uuid)
returns table(
  formulario_numero integer,
  desbloqueado boolean,
  data_desbloqueio date,
  preenchido boolean,
  data_preenchimento timestamptz,
  pode_preencher boolean
)
language plpgsql
security definer
as $$
declare
  data_hoje date := current_date;
  data_expiracao date;
  data_criacao date;
begin
  -- Buscar data de expiração e criação
  select 
    c.data_expiracao,
    coalesce(c.created_at::date, u.created_at::date, current_date) as created_at
  into data_expiracao, data_criacao
  from auth.users u
  left join public.consultoria_cadastros c on c.user_id = u.id
  where u.id = p_user_id
  limit 1;
  
  -- Garantir que data_criacao não seja null
  if data_criacao is null then
    data_criacao := current_date;
  end if;
  
  -- Verificar se acesso está válido
  -- Se expirado, ainda retornamos os formulários mas marcados como não disponíveis
  -- Isso permite que o usuário veja o status mesmo com acesso expirado
  
  -- Retornar status de cada formulário (1 a 4)
  for i in 1..4 loop
    declare
      data_desbloqueio_calc date;
      preenchido_check boolean := false;
      data_preenchimento_check timestamptz;
      pode_preencher_check boolean := false;
    begin
      -- Calcular data de desbloqueio
      data_desbloqueio_calc := public.calcular_data_desbloqueio_formulario(p_user_id, i);
      
      -- Verificar se já foi preenchido
      select 
        true,
        data_preenchimento
      into preenchido_check, data_preenchimento_check
      from public.acompanhamento_semanal
      where user_id = p_user_id
        and formulario_numero = i
      limit 1;
      
      -- Verificar se pode preencher
      -- Para o formulário 1, sempre permitir se não estiver preenchido e acesso não estiver expirado
      if i = 1 then
        -- Formulário 1: disponível se não estiver preenchido e acesso não estiver expirado
        if preenchido_check then
          pode_preencher_check := false;
        elsif data_expiracao is not null and data_hoje > data_expiracao then
          -- Acesso expirado
          pode_preencher_check := false;
        else
          -- Formulário 1 sempre disponível (desbloqueado desde a criação)
          pode_preencher_check := true;
          -- Garantir que data_desbloqueio_calc não seja null
          if data_desbloqueio_calc is null then
            data_desbloqueio_calc := data_criacao;
          end if;
          -- Garantir que desbloqueado seja true
          -- (será calculado na linha de retorno)
        end if;
      else
        -- Para outros formulários, usar lógica normal
        if preenchido_check then
          -- Já preenchido, não pode preencher novamente
          pode_preencher_check := false;
        elsif data_expiracao is not null and data_hoje > data_expiracao then
          -- Acesso expirado, não pode preencher
          pode_preencher_check := false;
        elsif data_desbloqueio_calc is null then
          -- Data de desbloqueio não calculada (problema no cálculo)
          pode_preencher_check := false;
        elsif data_hoje >= data_desbloqueio_calc then
          -- Data de desbloqueio chegou, pode preencher
          pode_preencher_check := true;
        else
          -- Ainda não desbloqueou
          pode_preencher_check := false;
        end if;
      end if;
      
      -- Para o formulário 1, garantir que sempre tenha data_desbloqueio
      if i = 1 and data_desbloqueio_calc is null then
        data_desbloqueio_calc := data_criacao;
      end if;
      
      -- Calcular se está desbloqueado
      -- Para formulário 1, sempre considerar desbloqueado se não estiver preenchido e acesso válido
      declare
        desbloqueado_check boolean;
      begin
        if i = 1 then
          -- Formulário 1: desbloqueado se não estiver preenchido e acesso válido
          desbloqueado_check := (not preenchido_check) and (data_expiracao is null or data_hoje <= data_expiracao);
          -- Se não foi calculada, usar data de criação
          if data_desbloqueio_calc is null then
            data_desbloqueio_calc := data_criacao;
          end if;
        else
          -- Outros formulários: desbloqueado se data chegou
          desbloqueado_check := (data_desbloqueio_calc is not null and data_hoje >= data_desbloqueio_calc);
        end if;
        
        -- Retornar linha
        return query select 
          i as formulario_numero,
          desbloqueado_check as desbloqueado,
          data_desbloqueio_calc as data_desbloqueio,
          coalesce(preenchido_check, false) as preenchido,
          data_preenchimento_check as data_preenchimento,
          pode_preencher_check as pode_preencher;
      end;
    end;
  end loop;
end;
$$;

-- Permissões
grant execute on function public.calcular_data_desbloqueio_formulario(uuid, integer) to authenticated;
grant execute on function public.formularios_disponiveis(uuid) to authenticated;

-- ============================================================
-- TRIGGER PARA DEFINIR DATA DE DESBLOQUEIO AO INSERIR
-- ============================================================

create or replace function public.trigger_definir_data_desbloqueio()
returns trigger
language plpgsql
as $$
begin
  -- Se data_desbloqueio não foi definida, calcular
  if NEW.data_desbloqueio is null and NEW.formulario_numero is not null then
    NEW.data_desbloqueio := public.calcular_data_desbloqueio_formulario(NEW.user_id, NEW.formulario_numero);
  end if;
  
  -- Se data_preenchimento não foi definida, usar agora
  if NEW.data_preenchimento is null then
    NEW.data_preenchimento := now();
  end if;
  
  return NEW;
end;
$$;

drop trigger if exists definir_data_desbloqueio_insert on public.acompanhamento_semanal;
create trigger definir_data_desbloqueio_insert
before insert on public.acompanhamento_semanal
for each row
execute function public.trigger_definir_data_desbloqueio();

-- ============================================================
-- COMENTÁRIOS
-- ============================================================

comment on column public.acompanhamento_semanal.formulario_numero is 'Número do formulário (1 a 4)';
comment on column public.acompanhamento_semanal.data_desbloqueio is 'Data em que o formulário foi/será desbloqueado';
comment on column public.acompanhamento_semanal.data_preenchimento is 'Data e hora em que o formulário foi preenchido';

