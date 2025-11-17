-- ============================================================
-- NOVO SISTEMA DE ACOMPANHAMENTO - 4 FORMULÁRIOS PROGRESSIVOS
-- VERSÃO CORRIGIDA (SEM BLOCOS DECLARE ANINHADOS)
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

-- Remover constraint antiga se existir
alter table public.acompanhamento_semanal
drop constraint if exists acompanhamento_formulario_unico;

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
  data_desbloqueio date;
  data_anterior_preenchimento date;
begin
  -- Buscar data de criação do usuário (prioridade: consultoria_cadastros.created_at, depois auth.users.created_at)
  select 
    coalesce(
      c.created_at::date,
      u.created_at::date,
      current_date
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
  
  -- Formulário 1: desbloqueado imediatamente na data de criação
  if p_formulario_numero = 1 then
    data_desbloqueio := data_criacao;
    return data_desbloqueio;
  end if;
  
  -- Para formulários 2, 3, 4: verificar quando o anterior foi preenchido
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
    -- Formulário 3: mínimo 4 dias após criação
    -- Formulário 4: mínimo 6 dias após criação
    data_desbloqueio := data_criacao + ((p_formulario_numero - 1) * 2);
  end if;
  
  return data_desbloqueio;
end;
$$;

-- ============================================================
-- FUNÇÃO PARA VERIFICAR FORMULÁRIOS DISPONÍVEIS (CORRIGIDA)
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
  data_desbloqueio_calc date;
  preenchido_check boolean;
  data_preenchimento_check timestamptz;
  pode_preencher_check boolean;
  desbloqueado_check boolean;
  i integer;
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
  
  -- Retornar status de cada formulário (1 a 4)
  for i in 1..4 loop
    -- Resetar variáveis para cada iteração
    preenchido_check := false;
    data_preenchimento_check := null;
    pode_preencher_check := false;
    desbloqueado_check := false;
    data_desbloqueio_calc := null;
    
    -- Calcular data de desbloqueio
    data_desbloqueio_calc := public.calcular_data_desbloqueio_formulario(p_user_id, i);
    
    -- Garantir que formulário 1 sempre tenha data de desbloqueio
    if i = 1 and data_desbloqueio_calc is null then
      data_desbloqueio_calc := data_criacao;
    end if;
    
    -- Verificar se já foi preenchido
    select 
      true,
      data_preenchimento
    into preenchido_check, data_preenchimento_check
    from public.acompanhamento_semanal
    where user_id = p_user_id
      and formulario_numero = i
    limit 1;
    
    -- Calcular se está desbloqueado e se pode preencher
    if i = 1 then
      -- Formulário 1: sempre desbloqueado se não estiver preenchido e acesso válido
      if preenchido_check then
        desbloqueado_check := true;
        pode_preencher_check := false;
      elsif data_expiracao is not null and data_hoje > data_expiracao then
        -- Acesso expirado
        desbloqueado_check := false;
        pode_preencher_check := false;
      else
        -- Formulário 1 disponível
        desbloqueado_check := true;
        pode_preencher_check := true;
        -- Garantir data de desbloqueio
        if data_desbloqueio_calc is null then
          data_desbloqueio_calc := data_criacao;
        end if;
      end if;
    else
      -- Outros formulários: verificar data de desbloqueio
      if preenchido_check then
        desbloqueado_check := true;
        pode_preencher_check := false;
      elsif data_expiracao is not null and data_hoje > data_expiracao then
        -- Acesso expirado
        desbloqueado_check := false;
        pode_preencher_check := false;
      elsif data_desbloqueio_calc is null then
        -- Data não calculada
        desbloqueado_check := false;
        pode_preencher_check := false;
      elsif data_hoje >= data_desbloqueio_calc then
        -- Data de desbloqueio chegou
        desbloqueado_check := true;
        pode_preencher_check := true;
      else
        -- Ainda não desbloqueou
        desbloqueado_check := false;
        pode_preencher_check := false;
      end if;
    end if;
    
    -- Retornar linha
    return query select 
      i as formulario_numero,
      desbloqueado_check as desbloqueado,
      data_desbloqueio_calc as data_desbloqueio,
      coalesce(preenchido_check, false) as preenchido,
      data_preenchimento_check as data_preenchimento,
      pode_preencher_check as pode_preencher;
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

