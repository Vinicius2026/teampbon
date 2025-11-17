-- ============================================================
-- ATUALIZAR VIEW user_profile PARA INCLUIR DATAS DE ENTRADA E TÉRMINO
-- ============================================================

drop view if exists public.user_profile;

create or replace view public.user_profile as
select 
  u.id,
  u.email,
  -- Prioriza nome_completo da tabela consultoria_cadastros, depois user_metadata
  coalesce(
    c.nome_completo, 
    u.raw_user_meta_data->>'nome_completo'
  ) as nome_completo,
  (auth.jwt() ->> 'role') as tipo_usuario,
  c.plano_contratado,
  c.objetivo,
  coalesce(c.form_preenchido, false) as form_preenchido,
  c.user_id,
  -- Data de entrada: prioriza created_at da consultoria_cadastros, depois auth.users.created_at
  coalesce(
    c.created_at::date,
    u.created_at::date
  ) as data_entrada,
  -- Data de término: data_expiracao da consultoria_cadastros
  c.data_expiracao::date as data_termino,
  -- Campos de controle de acesso
  c.data_expiracao,
  c.acesso_bloqueado
from auth.users u
left join public.consultoria_cadastros c on c.user_id = u.id
where u.id = auth.uid();

grant select on public.user_profile to authenticated;

-- ============================================================
-- COMENTÁRIO NA VIEW
-- ============================================================
comment on view public.user_profile is 'View para buscar dados do perfil do usuário autenticado. Inclui data de entrada e data de término do plano.';

