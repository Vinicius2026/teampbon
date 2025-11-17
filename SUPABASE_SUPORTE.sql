-- ============================================================
-- SISTEMA DE SUPORTE
-- Mensagens de suporte entre usuários e administradores
-- ============================================================

-- Tabela para armazenar mensagens de suporte
create table if not exists public.suporte (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  user_email text,
  mensagem_usuario text not null,
  mensagem_usuario_enviada_em timestamptz default now() not null,
  resposta_admin text,
  resposta_admin_enviada_por uuid references auth.users(id) on delete set null,
  resposta_admin_enviada_por_email text,
  resposta_admin_enviada_em timestamptz,
  lido_pelo_usuario boolean default false not null,
  lido_pelo_usuario_em timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now()
);

-- Índices para performance
create index if not exists idx_suporte_user_id on public.suporte(user_id);
create index if not exists idx_suporte_lido on public.suporte(user_id, lido_pelo_usuario);
create index if not exists idx_suporte_resposta on public.suporte(user_id, resposta_admin_enviada_em desc);

-- Trigger para atualizar updated_at
create or replace function public.update_suporte_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Remover trigger se já existir
drop trigger if exists trigger_update_suporte_updated_at on public.suporte;

-- Criar trigger
create trigger trigger_update_suporte_updated_at
before update on public.suporte
for each row
execute function public.update_suporte_updated_at();

-- Enable RLS
alter table public.suporte enable row level security;

-- ============================================================
-- POLÍTICAS RLS
-- ============================================================

-- Remover políticas antigas se existirem
drop policy if exists "user_read_own_suporte" on public.suporte;
drop policy if exists "user_insert_own_suporte" on public.suporte;
drop policy if exists "user_update_own_suporte" on public.suporte;
drop policy if exists "admin_read_all_suporte" on public.suporte;
drop policy if exists "admin_update_all_suporte" on public.suporte;

-- Policy: Usuário pode ler suas próprias mensagens de suporte
create policy "user_read_own_suporte"
on public.suporte
for select
to authenticated
using (auth.uid() = user_id);

-- Policy: Usuário pode inserir suas próprias mensagens de suporte
create policy "user_insert_own_suporte"
on public.suporte
for insert
to authenticated
with check (auth.uid() = user_id);

-- Nota: Usuários não têm política de UPDATE direta
-- Eles atualizam apenas através da função marcar_resposta_suporte_lida
-- que é security definer e tem permissões próprias

-- Policy: Admin pode ler todas as mensagens de suporte
create policy "admin_read_all_suporte"
on public.suporte
for select
to authenticated
using (public.is_admin_user());

-- Policy: Admin pode atualizar todas as mensagens (para responder)
create policy "admin_update_all_suporte"
on public.suporte
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

-- Policy: Admin pode inserir mensagens de suporte (para criar tickets manualmente se necessário)
create policy "admin_insert_suporte"
on public.suporte
for insert
to authenticated
with check (public.is_admin_user());

-- ============================================================
-- FUNÇÕES AUXILIARES
-- ============================================================

-- Função: Contar mensagens não lidas do admin para o usuário
create or replace function public.contar_mensagens_suporte_nao_lidas(p_user_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  v_count integer;
begin
  select count(*)
  into v_count
  from public.suporte
  where user_id = p_user_id
    and resposta_admin is not null
    and resposta_admin != ''
    and lido_pelo_usuario = false;
  
  return coalesce(v_count, 0);
end;
$$;

-- Função: Verificar se usuário tem solicitações de suporte
create or replace function public.tem_solicitacao_suporte(p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_count integer;
begin
  select count(*)
  into v_count
  from public.suporte
  where user_id = p_user_id
    and mensagem_usuario is not null
    and mensagem_usuario != '';
  
  return coalesce(v_count, 0) > 0;
end;
$$;

-- Função: Buscar mensagens de suporte do usuário
create or replace function public.buscar_suporte_usuario(p_user_id uuid)
returns table(
  id uuid,
  mensagem_usuario text,
  mensagem_usuario_enviada_em timestamptz,
  resposta_admin text,
  resposta_admin_enviada_por_email text,
  resposta_admin_enviada_em timestamptz,
  lido_pelo_usuario boolean,
  lido_pelo_usuario_em timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    s.id,
    s.mensagem_usuario,
    s.mensagem_usuario_enviada_em,
    s.resposta_admin,
    s.resposta_admin_enviada_por_email,
    s.resposta_admin_enviada_em,
    s.lido_pelo_usuario,
    s.lido_pelo_usuario_em,
    s.created_at
  from public.suporte s
  where s.user_id = p_user_id
  order by s.mensagem_usuario_enviada_em desc;
end;
$$;

-- Função: Marcar resposta como lida pelo usuário
create or replace function public.marcar_resposta_suporte_lida(p_suporte_id uuid, p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_row_count integer;
begin
  update public.suporte
  set lido_pelo_usuario = true,
      lido_pelo_usuario_em = now()
  where id = p_suporte_id
    and user_id = p_user_id
    and resposta_admin is not null
    and resposta_admin != ''
    and lido_pelo_usuario = false;
  
  get diagnostics v_row_count = row_count;
  return v_row_count > 0;
end;
$$;

-- ============================================================
-- GRANTS
-- ============================================================
grant execute on function public.contar_mensagens_suporte_nao_lidas(uuid) to authenticated;
grant execute on function public.tem_solicitacao_suporte(uuid) to authenticated;
grant execute on function public.buscar_suporte_usuario(uuid) to authenticated;
grant execute on function public.marcar_resposta_suporte_lida(uuid, uuid) to authenticated;

