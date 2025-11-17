-- ============================================================
-- SISTEMA DE ORIENTAÇÕES EXPERT
-- Mensagens do administrador para os usuários
-- ============================================================

-- Tabela para armazenar mensagens/orientações
create table if not exists public.orientacoes_expert (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  user_email text,
  mensagem text not null,
  enviado_por uuid references auth.users(id) on delete set null,
  enviado_por_email text,
  enviado_em timestamptz default now() not null,
  lido boolean default false not null,
  lido_em timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now()
);

-- Índices para performance
create index if not exists idx_orientacoes_user_id on public.orientacoes_expert(user_id);
create index if not exists idx_orientacoes_lido on public.orientacoes_expert(user_id, lido);
create index if not exists idx_orientacoes_enviado_em on public.orientacoes_expert(enviado_em desc);

-- Trigger para atualizar updated_at
create or replace function public.update_orientacoes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Remover trigger se já existir
drop trigger if exists trigger_update_orientacoes_updated_at on public.orientacoes_expert;

-- Criar trigger
create trigger trigger_update_orientacoes_updated_at
before update on public.orientacoes_expert
for each row
execute function public.update_orientacoes_updated_at();

-- Enable RLS
alter table public.orientacoes_expert enable row level security;

-- Remover políticas antigas se existirem (para evitar conflitos)
drop policy if exists "user_read_own_messages" on public.orientacoes_expert;
drop policy if exists "user_update_own_messages" on public.orientacoes_expert;
drop policy if exists "admin_read_all_messages" on public.orientacoes_expert;
drop policy if exists "admin_insert_messages" on public.orientacoes_expert;
drop policy if exists "admin_update_all_messages" on public.orientacoes_expert;

-- Policy: Usuário pode ler apenas suas próprias mensagens
create policy "user_read_own_messages"
on public.orientacoes_expert
for select
to authenticated
using (auth.uid() = user_id);

-- Policy: Usuário pode atualizar apenas suas próprias mensagens (para marcar como lido)
create policy "user_update_own_messages"
on public.orientacoes_expert
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Policy: Admin pode ler todas as mensagens
create policy "admin_read_all_messages"
on public.orientacoes_expert
for select
to authenticated
using (
  (auth.jwt() ->> 'role') = 'admin'
);

-- Policy: Admin pode inserir mensagens para qualquer usuário
create policy "admin_insert_messages"
on public.orientacoes_expert
for insert
to authenticated
with check (
  (auth.jwt() ->> 'role') = 'admin'
);

-- Policy: Admin pode atualizar qualquer mensagem
create policy "admin_update_all_messages"
on public.orientacoes_expert
for update
to authenticated
using (
  (auth.jwt() ->> 'role') = 'admin'
)
with check (
  (auth.jwt() ->> 'role') = 'admin'
);

-- ============================================================
-- FUNÇÃO: Contar mensagens não lidas
-- ============================================================

create or replace function public.contar_mensagens_nao_lidas(p_user_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  v_count integer;
begin
  select count(*)
  into v_count
  from public.orientacoes_expert
  where user_id = p_user_id
    and lido = false;
  
  return coalesce(v_count, 0);
end;
$$;

-- ============================================================
-- FUNÇÃO: Buscar mensagens do usuário
-- ============================================================

create or replace function public.buscar_mensagens_usuario(p_user_id uuid)
returns table(
  id uuid,
  mensagem text,
  enviado_por_email text,
  enviado_em timestamptz,
  lido boolean,
  lido_em timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    o.id,
    o.mensagem,
    o.enviado_por_email,
    o.enviado_em,
    o.lido,
    o.lido_em,
    o.created_at
  from public.orientacoes_expert o
  where o.user_id = p_user_id
  order by o.enviado_em desc;
end;
$$;

-- ============================================================
-- FUNÇÃO: Marcar mensagem como lida
-- ============================================================

create or replace function public.marcar_mensagem_lida(p_mensagem_id uuid, p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_row_count integer;
begin
  update public.orientacoes_expert
  set lido = true,
      lido_em = now()
  where id = p_mensagem_id
    and user_id = p_user_id
    and lido = false;
  
  get diagnostics v_row_count = row_count;
  return v_row_count > 0;
end;
$$;

