-- ============================================================
-- CORREÇÃO COMPLETA: Sistema de Orientações Expert
-- ============================================================
-- Este script corrige todos os problemas conhecidos:
-- 1. Remove trigger duplicado
-- 2. Corrige políticas RLS com verificação de role correta
-- 3. Recria todas as políticas

-- ============================================================
-- 1. CORRIGIR TRIGGER
-- ============================================================

-- Remover trigger se já existir
drop trigger if exists trigger_update_orientacoes_updated_at on public.orientacoes_expert;

-- Criar/recriar função do trigger
create or replace function public.update_orientacoes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Criar trigger
create trigger trigger_update_orientacoes_updated_at
before update on public.orientacoes_expert
for each row
execute function public.update_orientacoes_updated_at();

-- ============================================================
-- 2. CORRIGIR POLÍTICAS RLS
-- ============================================================

-- Remover todas as políticas antigas
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
-- 3. VERIFICAR SE FUNÇÕES EXISTEM E RECRIAR SE NECESSÁRIO
-- ============================================================

-- Função: Contar mensagens não lidas
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

-- Função: Buscar mensagens do usuário
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

-- Função: Marcar mensagem como lida
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

