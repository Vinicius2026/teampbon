-- ============================================================
-- SISTEMA DE VISUALIZAÇÃO DE ACOMPANHAMENTOS PELO ADMIN
-- ============================================================

-- Adicionar coluna para rastrear se o admin já visualizou/confirmou o acompanhamento
alter table public.acompanhamento_semanal
add column if not exists admin_visualizado boolean default false;

alter table public.acompanhamento_semanal
add column if not exists admin_visualizado_em timestamptz;

-- Índice para performance
create index if not exists idx_acompanhamento_admin_visualizado on public.acompanhamento_semanal(user_id, admin_visualizado);

-- Comentário
comment on column public.acompanhamento_semanal.admin_visualizado is 'Indica se o administrador já visualizou e confirmou a análise deste acompanhamento';
comment on column public.acompanhamento_semanal.admin_visualizado_em is 'Data e hora em que o administrador visualizou/confirmou a análise';

-- ============================================================
-- FUNÇÃO: VERIFICAR SE USUÁRIO TEM ACOMPANHAMENTOS NÃO VISUALIZADOS
-- ============================================================

create or replace function public.tem_acompanhamentos_nao_visualizados(p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_count integer;
begin
  select count(*)
  into v_count
  from public.acompanhamento_semanal
  where user_id = p_user_id
    and admin_visualizado = false
    and formulario_numero is not null;
  
  return v_count > 0;
end;
$$;

grant execute on function public.tem_acompanhamentos_nao_visualizados(uuid) to authenticated;

-- ============================================================
-- VIEW: USUÁRIOS COM ACOMPANHAMENTOS NÃO VISUALIZADOS
-- ============================================================

create or replace view public.usuarios_com_progresso_pendente as
select distinct
  c.id,
  c.user_id,
  c.email,
  c.nome_completo,
  c.status,
  count(a.id) filter (where a.admin_visualizado = false) as acompanhamentos_nao_visualizados
from public.consultoria_cadastros c
inner join public.acompanhamento_semanal a on a.user_id = c.user_id
where a.admin_visualizado = false
  and a.formulario_numero is not null
group by c.id, c.user_id, c.email, c.nome_completo, c.status;

grant select on public.usuarios_com_progresso_pendente to authenticated;

-- ============================================================
-- POLICY: Admin pode atualizar admin_visualizado
-- ============================================================

-- Permitir que admin atualize a coluna admin_visualizado
create policy "admin_update_visualizado"
on public.acompanhamento_semanal
for update
to authenticated
using ((auth.jwt() ->> 'role') = 'admin')
with check ((auth.jwt() ->> 'role') = 'admin');

