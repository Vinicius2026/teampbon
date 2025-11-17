-- ============================================================
-- CORREÇÃO: Ambiguidade na função formularios_disponiveis
-- ============================================================
-- Problema: A coluna "data_preenchimento" estava causando ambiguidade
-- porque existe uma variável PL/pgSQL com o mesmo nome.
-- Solução: Qualificar a coluna usando alias da tabela.

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
    
    -- CORREÇÃO: Qualificar a coluna usando alias da tabela para evitar ambiguidade
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

