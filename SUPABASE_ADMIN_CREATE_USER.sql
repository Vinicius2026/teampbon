-- ============================================================
-- MODIFICAÇÕES PARA SISTEMA DE CRIAÇÃO DE USUÁRIOS PELO ADMIN
-- ============================================================

-- 1) Adicionar campo user_id na tabela consultoria_cadastros (se não existir)
alter table public.consultoria_cadastros 
add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 2) Adicionar campo form_preenchido para indicar se formulário foi completado
alter table public.consultoria_cadastros 
add column if not exists form_preenchido boolean default false;

-- 3) Criar índice para melhor performance nas consultas
create index if not exists idx_consultoria_user_id on public.consultoria_cadastros(user_id);
create index if not exists idx_consultoria_form_preenchido on public.consultoria_cadastros(form_preenchido);

-- 4) Atualizar policies para permitir que usuários autenticados leiam seus próprios registros
drop policy if exists "user_read_own_cadastro" on public.consultoria_cadastros;
create policy "user_read_own_cadastro"
on public.consultoria_cadastros
for select
to authenticated
using (
  user_id = auth.uid() or (auth.jwt() ->> 'role') = 'admin'
);

-- 5) Policy para usuário atualizar seu próprio cadastro (quando preenche formulário)
drop policy if exists "user_update_own_cadastro" on public.consultoria_cadastros;
create policy "user_update_own_cadastro"
on public.consultoria_cadastros
for update
to authenticated
using (
  user_id = auth.uid() or (auth.jwt() ->> 'role') = 'admin'
)
with check (
  user_id = auth.uid() or (auth.jwt() ->> 'role') = 'admin'
);

-- 6) Policy para usuário inserir seu próprio cadastro (caso necessário)
drop policy if exists "user_insert_own_cadastro" on public.consultoria_cadastros;
create policy "user_insert_own_cadastro"
on public.consultoria_cadastros
for insert
to authenticated
with check (
  user_id = auth.uid() or (auth.jwt() ->> 'role') = 'admin'
);

-- 7) Atualizar view user_profile para incluir form_preenchido
-- Prioriza nome_completo da tabela consultoria_cadastros, depois user_metadata
-- NÃO usa email como fallback - se não tiver nome, retorna NULL
create or replace view public.user_profile as
select 
  u.id,
  u.email,
  coalesce(c.nome_completo, u.raw_user_meta_data->>'nome_completo') as nome_completo,
  (auth.jwt() ->> 'role') as tipo_usuario,
  c.plano_contratado,
  c.objetivo,
  coalesce(c.form_preenchido, false) as form_preenchido,
  c.user_id
from auth.users u
left join public.consultoria_cadastros c on c.user_id = u.id
where u.id = auth.uid();

grant select on public.user_profile to authenticated;

-- 8) View para admin ver todos os usuários com status do formulário
-- Prioriza nome_completo da tabela consultoria_cadastros, mas usa user_metadata como fallback
create or replace view public.admin_users_view as
select 
  u.id as user_id,
  u.email,
  u.created_at as user_created_at,
  coalesce(c.nome_completo, u.raw_user_meta_data->>'nome_completo') as nome_completo,
  (u.raw_app_meta_data->>'role')::text as role,
  c.id as cadastro_id,
  c.status,
  c.form_preenchido,
  c.created_at as cadastro_created_at,
  c.plano_contratado,
  c.objetivo
from auth.users u
left join public.consultoria_cadastros c on c.user_id = u.id
where (u.raw_app_meta_data->>'role')::text = 'consultoria'
order by u.created_at desc;

-- Grant para admin ver a view
grant select on public.admin_users_view to authenticated;

-- 9) Comentários nas colunas
comment on column public.consultoria_cadastros.user_id is 'ID do usuário autenticado (referência a auth.users)';
comment on column public.consultoria_cadastros.form_preenchido is 'Indica se o usuário completou o formulário de cadastro após login';

