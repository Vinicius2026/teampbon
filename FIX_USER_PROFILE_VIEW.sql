-- ============================================================
-- CORREÇÃO DA VIEW user_profile PARA GARANTIR NOME DO USUÁRIO
-- ============================================================
-- Esta view garante que o nome do usuário apareça corretamente na dashboard
-- Prioriza: 1) nome_completo da tabela consultoria_cadastros (user_id)
--           2) nome_completo do user_metadata do auth.users
-- NÃO usa email como fallback - se não tiver nome, retorna NULL

drop view if exists public.user_profile;

create or replace view public.user_profile as
select 
  u.id,
  u.email,
  -- Prioriza nome_completo da tabela consultoria_cadastros, depois user_metadata
  -- NÃO usa email como fallback - se não tiver nome, retorna NULL
  coalesce(
    c.nome_completo, 
    u.raw_user_meta_data->>'nome_completo'
  ) as nome_completo,
  (auth.jwt() ->> 'role') as tipo_usuario,
  c.plano_contratado,
  c.objetivo,
  coalesce(c.form_preenchido, false) as form_preenchido,
  c.user_id
from auth.users u
left join public.consultoria_cadastros c on c.user_id = u.id
where u.id = auth.uid();

grant select on public.user_profile to authenticated;

-- ============================================================
-- COMENTÁRIO NA VIEW
-- ============================================================
comment on view public.user_profile is 'View para buscar dados do perfil do usuário autenticado. Prioriza nome_completo da tabela consultoria_cadastros.';

