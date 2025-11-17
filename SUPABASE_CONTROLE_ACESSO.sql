-- ============================================================
-- SISTEMA DE CONTROLE DE PRAZO DE VALIDADE DE ACESSO
-- ============================================================

-- 1) Adicionar campos de controle de acesso na tabela consultoria_cadastros
alter table public.consultoria_cadastros 
add column if not exists dias_acesso integer default 30;

alter table public.consultoria_cadastros 
add column if not exists data_expiracao date;

alter table public.consultoria_cadastros 
add column if not exists dias_adicionais integer default 0;

alter table public.consultoria_cadastros 
add column if not exists acesso_bloqueado boolean default false;

-- 2) Criar índices para melhor performance
create index if not exists idx_consultoria_data_expiracao on public.consultoria_cadastros(data_expiracao);
create index if not exists idx_consultoria_acesso_bloqueado on public.consultoria_cadastros(acesso_bloqueado);

-- 3) Função para calcular data de expiração
create or replace function public.calcular_data_expiracao(
  dias_iniciais integer,
  dias_adicionais integer default 0
) returns date
language plpgsql
as $$
declare
  data_exp date;
begin
  -- Calcular data de expiração: hoje + dias_iniciais + dias_adicionais
  data_exp := (current_date + dias_iniciais + dias_adicionais);
  return data_exp;
end;
$$;

-- 4) Função para verificar se acesso está válido
create or replace function public.acesso_valido(p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  data_exp date;
  bloqueado boolean;
begin
  -- Buscar data de expiração e status de bloqueio
  select 
    c.data_expiracao,
    coalesce(c.acesso_bloqueado, false)
  into data_exp, bloqueado
  from public.consultoria_cadastros c
  where c.user_id = p_user_id
  limit 1;
  
  -- Se não encontrou registro, retorna false
  if data_exp is null then
    return false;
  end if;
  
  -- Se está bloqueado manualmente, retorna false
  if bloqueado then
    return false;
  end if;
  
  -- Se data de expiração já passou, retorna false
  if data_exp < current_date then
    return false;
  end if;
  
  -- Acesso válido
  return true;
end;
$$;

-- 5) Grant para executar as funções
grant execute on function public.calcular_data_expiracao(integer, integer) to authenticated;
grant execute on function public.acesso_valido(uuid) to authenticated;

-- 6) Trigger para calcular data de expiração automaticamente quando dias são definidos
create or replace function public.trigger_calcular_expiracao()
returns trigger
language plpgsql
as $$
begin
  -- Se dias_acesso foi definido, calcular data de expiração
  -- Se data_expiracao não está definida ou dias_acesso/dias_adicionais mudaram, recalcular
  if NEW.dias_acesso is not null then
    -- Se não tem data_expiracao OU se dias_acesso ou dias_adicionais mudaram, recalcular
    if NEW.data_expiracao is null or 
       (OLD.dias_acesso is distinct from NEW.dias_acesso) or
       (OLD.dias_adicionais is distinct from NEW.dias_adicionais) then
      NEW.data_expiracao := public.calcular_data_expiracao(
        coalesce(NEW.dias_acesso, 30),
        coalesce(NEW.dias_adicionais, 0)
      );
    end if;
  -- Se não tem dias_acesso mas tem data_expiracao, manter a data
  -- Se não tem nenhum dos dois, tentar calcular se houver created_at
  elsif NEW.data_expiracao is null and NEW.dias_acesso is null then
    -- Se tem created_at, calcular a partir da data de criação + 30 dias padrão
    if NEW.created_at is not null then
      NEW.data_expiracao := (NEW.created_at::date + coalesce(NEW.dias_adicionais, 0) + 30);
    else
      -- Se não tem created_at, calcular a partir de hoje
      NEW.data_expiracao := public.calcular_data_expiracao(30, coalesce(NEW.dias_adicionais, 0));
    end if;
  end if;
  
  return NEW;
end;
$$;

-- 7) Criar trigger antes de inserir
drop trigger if exists calcular_expiracao_insert on public.consultoria_cadastros;
create trigger calcular_expiracao_insert
before insert on public.consultoria_cadastros
for each row
execute function public.trigger_calcular_expiracao();

-- 8) Criar trigger antes de atualizar
-- Recalcula data_expiracao quando dias_acesso ou dias_adicionais mudam
-- OU quando data_expiracao está null mas dias_acesso está definido
drop trigger if exists calcular_expiracao_update on public.consultoria_cadastros;
create trigger calcular_expiracao_update
before update on public.consultoria_cadastros
for each row
when (
  OLD.dias_acesso is distinct from NEW.dias_acesso 
  or OLD.dias_adicionais is distinct from NEW.dias_adicionais
  or (NEW.data_expiracao is null and NEW.dias_acesso is not null)
)
execute function public.trigger_calcular_expiracao();

-- 9) Atualizar view user_profile para incluir informações de acesso
create or replace view public.user_profile as
select 
  u.id,
  u.email,
  coalesce(c.nome_completo, u.raw_user_meta_data->>'nome_completo') as nome_completo,
  (auth.jwt() ->> 'role') as tipo_usuario,
  c.plano_contratado,
  c.objetivo,
  coalesce(c.form_preenchido, false) as form_preenchido,
  c.user_id,
  c.dias_acesso,
  c.data_expiracao,
  c.dias_adicionais,
  coalesce(c.acesso_bloqueado, false) as acesso_bloqueado,
  public.acesso_valido(u.id) as acesso_valido
from auth.users u
left join public.consultoria_cadastros c on c.user_id = u.id
where u.id = auth.uid();

grant select on public.user_profile to authenticated;

-- 10) Comentários nas colunas
comment on column public.consultoria_cadastros.dias_acesso is 'Número de dias de acesso inicial (30 ou 90 dias)';
comment on column public.consultoria_cadastros.data_expiracao is 'Data de expiração do acesso (calculada automaticamente)';
comment on column public.consultoria_cadastros.dias_adicionais is 'Dias adicionais adicionados pelo administrador';
comment on column public.consultoria_cadastros.acesso_bloqueado is 'Indica se o acesso foi bloqueado manualmente pelo administrador';

-- 11) Atualizar registros existentes para ter 30 dias de acesso padrão
update public.consultoria_cadastros
set 
  dias_acesso = 30,
  dias_adicionais = 0,
  data_expiracao = current_date + 30,
  acesso_bloqueado = false
where dias_acesso is null or data_expiracao is null;

