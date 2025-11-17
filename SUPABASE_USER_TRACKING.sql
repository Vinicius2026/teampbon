-- ============================================================
-- TABELA DE ACOMPANHAMENTO SEMANAL (USER TRACKING)
-- ============================================================

create table if not exists public.acompanhamento_semanal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  user_email text,
  
  -- Data e controle
  semana_inicio date not null, -- Sexta-feira da semana
  semana_fim date not null,    -- Domingo da semana
  created_at timestamptz default now(),
  
  -- Hidratação
  hidratacao text check (hidratacao in ('2L', '3L', '4L', '5L')),
  
  -- Treino por dia (JSON: {dia: {percentual: '50%'|'75%'|'100%'|'não treinei'}})
  treino_dias jsonb default '{}'::jsonb,
  
  -- Performance de treino (array de exercícios marcados)
  exercicios_realizados text[] default array[]::text[],
  
  -- Sono
  horas_sono text check (horas_sono in ('6h', '7h', '8h', '9h', '10h')),
  
  -- Peso atual
  peso_atual numeric(5,1),
  
  -- Desafios e conquistas (opcional)
  desafios_conquistas text,
  
  -- Constraint: 1 registro por semana por usuário
  unique(user_id, semana_inicio)
);

-- Index para performance
create index if not exists idx_acompanhamento_user on public.acompanhamento_semanal(user_id, semana_inicio desc);
create index if not exists idx_acompanhamento_semana on public.acompanhamento_semanal(semana_inicio desc);

-- Enable RLS
alter table public.acompanhamento_semanal enable row level security;

-- Policy: Usuário pode ler apenas seus próprios registros
create policy "user_read_own_tracking"
on public.acompanhamento_semanal
for select
to authenticated
using (auth.uid() = user_id);

-- Policy: Usuário pode inserir apenas seus próprios registros
create policy "user_insert_own_tracking"
on public.acompanhamento_semanal
for insert
to authenticated
with check (auth.uid() = user_id);

-- Policy: Admin pode ler todos os registros
create policy "admin_read_all_tracking"
on public.acompanhamento_semanal
for select
to authenticated
using ((auth.jwt() ->> 'role') = 'admin');

-- ============================================================
-- VIEW PARA ADMIN (informações consolidadas)
-- ============================================================

create or replace view public.acompanhamento_consolidado as
select 
  a.*,
  u.email as usuario_email,
  u.raw_user_meta_data->>'nome_completo' as usuario_nome,
  extract(week from a.semana_inicio) as numero_semana,
  extract(year from a.semana_inicio) as ano
from public.acompanhamento_semanal a
left join auth.users u on u.id = a.user_id
order by a.created_at desc;

-- ============================================================
-- FUNCTION PARA VERIFICAR SE USUÁRIO PODE RESPONDER HOJE
-- ============================================================

create or replace function public.pode_responder_hoje()
returns table(pode_responder boolean, proxima_data date, ultima_resposta date) 
language plpgsql
security definer
as $$
declare
  hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  dia_semana int := extract(dow from hoje); -- 0=domingo, 5=sexta, 6=sábado
  semana_atual_inicio date;
  ultima_resposta_semana date;
begin
  -- Sexta=5, Sábado=6, Domingo=0
  if dia_semana not in (0, 5, 6) then
    -- Não é final de semana, calcular próxima sexta
    return query select 
      false as pode_responder,
      (hoje + ((5 - dia_semana + 7) % 7)::int)::date as proxima_data,
      null::date as ultima_resposta;
    return;
  end if;
  
  -- É final de semana, verificar se já respondeu esta semana
  -- Semana começa na sexta mais recente
  if dia_semana = 5 then
    semana_atual_inicio := hoje;
  elsif dia_semana = 6 then
    semana_atual_inicio := hoje - 1;
  else -- domingo
    semana_atual_inicio := hoje - 2;
  end if;
  
  -- Buscar última resposta do usuário nesta semana
  select a.semana_inicio into ultima_resposta_semana
  from public.acompanhamento_semanal a
  where a.user_id = auth.uid()
    and a.semana_inicio = semana_atual_inicio
  limit 1;
  
  if ultima_resposta_semana is not null then
    -- Já respondeu esta semana
    return query select 
      false as pode_responder,
      (semana_atual_inicio + 7)::date as proxima_data,
      ultima_resposta_semana as ultima_resposta;
  else
    -- Pode responder
    return query select 
      true as pode_responder,
      null::date as proxima_data,
      null::date as ultima_resposta;
  end if;
end;
$$;

-- Permissão para executar a function
grant execute on function public.pode_responder_hoje() to authenticated;

-- ============================================================
-- VERIFICAR DADOS DO USUÁRIO (para menu lateral)
-- ============================================================

create or replace view public.user_profile as
select 
  u.id,
  u.email,
  u.raw_user_meta_data->>'nome_completo' as nome_completo,
  (auth.jwt() ->> 'role') as tipo_usuario,
  c.plano_contratado,
  c.objetivo
from auth.users u
left join public.consultoria_cadastros c on c.email = u.email
where u.id = auth.uid();

grant select on public.user_profile to authenticated;

