-- ============================================================
-- NOVO SISTEMA DE ACOMPANHAMENTO - 4 FORMULÁRIOS PROGRESSIVOS
-- VERSÃO FINAL CORRIGIDA
-- ============================================================

-- Remover constraint antiga
alter table public.acompanhamento_semanal 
drop constraint if exists acompanhamento_semanal_user_id_semana_inicio_key;

-- Adicionar novas colunas
alter table public.acompanhamento_semanal
add column if not exists formulario_numero integer check (formulario_numero between 1 and 4);

alter table public.acompanhamento_semanal
add column if not exists data_preenchimento timestamptz default now();

alter table public.acompanhamento_semanal
add column if not exists data_desbloqueio date;

-- Remover constraint antiga se existir
alter table public.acompanhamento_semanal
drop constraint if exists acompanhamento_formulario_unico;

-- Nova constraint
alter table public.acompanhamento_semanal
add constraint acompanhamento_formulario_unico unique(user_id, formulario_numero);

-- Índices
create index if not exists idx_acompanhamento_formulario on public.acompanhamento_semanal(user_id, formulario_numero);
create index if not exists idx_acompanhamento_data_desbloqueio on public.acompanhamento_semanal(data_desbloqueio);

-- ============================================================
-- FUNÇÃO: CALCULAR DATA DE DESBLOQUEIO
-- ============================================================

create or replace function public.calcular_data_desbloqueio_formulario(
  p_user_id uuid,
  p_formulario_numero integer
) returns date
language plpgsql
security definer
as $$
declare
  v_data_criacao date;
  v_data_expiracao date;
  v_data_desbloqueio date;
  v_data_anterior date;
begin
  select 
    coalesce(c.created_at::date, u.created_at::date, current_date)
  into v_data_criacao
  from auth.users u
  left join public.consultoria_cadastros c on c.user_id = u.id
  where u.id = p_user_id
  limit 1;
  
  if v_data_criacao is null then
    v_data_criacao := current_date;
  end if;
  
  select data_expiracao into v_data_expiracao
  from public.consultoria_cadastros
  where user_id = p_user_id
  limit 1;
  
  if p_formulario_numero = 1 then
    return v_data_criacao;
  end if;
  
  select data_preenchimento::date into v_data_anterior
  from public.acompanhamento_semanal
  where user_id = p_user_id
    and formulario_numero = p_formulario_numero - 1
  limit 1;
  
  if v_data_anterior is not null then
    v_data_desbloqueio := v_data_anterior + 2;
  else
    v_data_desbloqueio := v_data_criacao + ((p_formulario_numero - 1) * 2);
  end if;
  
  return v_data_desbloqueio;
end;
$$;

-- ============================================================
-- FUNÇÃO: FORMULÁRIOS DISPONÍVEIS
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
  v_data_hoje date := current_date;
  v_data_expiracao date;
  v_data_criacao date;
  v_data_desbloqueio date;
  v_preenchido boolean;
  v_data_preenchimento timestamptz;
  v_pode_preencher boolean;
  v_desbloqueado boolean;
  v_form_num integer;
begin
  select 
    c.data_expiracao,
    coalesce(c.created_at::date, u.created_at::date, current_date)
  into v_data_expiracao, v_data_criacao
  from auth.users u
  left join public.consultoria_cadastros c on c.user_id = u.id
  where u.id = p_user_id
  limit 1;
  
  if v_data_criacao is null then
    v_data_criacao := current_date;
  end if;
  
  for v_form_num in 1..4 loop
    v_preenchido := false;
    v_data_preenchimento := null;
    v_pode_preencher := false;
    v_desbloqueado := false;
    v_data_desbloqueio := null;
    
    v_data_desbloqueio := public.calcular_data_desbloqueio_formulario(p_user_id, v_form_num);
    
    if v_data_desbloqueio is null and v_form_num = 1 then
      v_data_desbloqueio := v_data_criacao;
    end if;
    
    select true, a.data_preenchimento
    into v_preenchido, v_data_preenchimento
    from public.acompanhamento_semanal a
    where a.user_id = p_user_id
      and a.formulario_numero = v_form_num
    limit 1;
    
    if v_form_num = 1 then
      if v_preenchido then
        v_desbloqueado := true;
        v_pode_preencher := false;
      elsif v_data_expiracao is not null and v_data_hoje > v_data_expiracao then
        v_desbloqueado := false;
        v_pode_preencher := false;
      else
        v_desbloqueado := true;
        v_pode_preencher := true;
        if v_data_desbloqueio is null then
          v_data_desbloqueio := v_data_criacao;
        end if;
      end if;
    else
      if v_preenchido then
        v_desbloqueado := true;
        v_pode_preencher := false;
      elsif v_data_expiracao is not null and v_data_hoje > v_data_expiracao then
        v_desbloqueado := false;
        v_pode_preencher := false;
      elsif v_data_desbloqueio is null then
        v_desbloqueado := false;
        v_pode_preencher := false;
      elsif v_data_hoje >= v_data_desbloqueio then
        v_desbloqueado := true;
        v_pode_preencher := true;
      else
        v_desbloqueado := false;
        v_pode_preencher := false;
      end if;
    end if;
    
    return query select 
      v_form_num,
      v_desbloqueado,
      v_data_desbloqueio,
      coalesce(v_preenchido, false),
      v_data_preenchimento,
      v_pode_preencher;
  end loop;
end;
$$;

-- Permissões
grant execute on function public.calcular_data_desbloqueio_formulario(uuid, integer) to authenticated;
grant execute on function public.formularios_disponiveis(uuid) to authenticated;

-- ============================================================
-- TRIGGER
-- ============================================================

create or replace function public.trigger_definir_data_desbloqueio()
returns trigger
language plpgsql
as $$
begin
  if NEW.data_desbloqueio is null and NEW.formulario_numero is not null then
    NEW.data_desbloqueio := public.calcular_data_desbloqueio_formulario(NEW.user_id, NEW.formulario_numero);
  end if;
  
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

-- Comentários
comment on column public.acompanhamento_semanal.formulario_numero is 'Número do formulário (1 a 4)';
comment on column public.acompanhamento_semanal.data_desbloqueio is 'Data em que o formulário foi/será desbloqueado';
comment on column public.acompanhamento_semanal.data_preenchimento is 'Data e hora em que o formulário foi preenchido';

