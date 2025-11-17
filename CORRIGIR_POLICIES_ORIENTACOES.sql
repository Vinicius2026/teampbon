-- ============================================================
-- CORREÇÃO: Políticas RLS para orientacoes_expert
-- ============================================================
-- Problema: A verificação de role estava usando app_metadata incorretamente
-- Solução: Usar (auth.jwt() ->> 'role') = 'admin' como nos outros lugares

-- Remover políticas antigas (todas, incluindo as de usuário para garantir limpeza)
drop policy if exists "user_read_own_messages" on public.orientacoes_expert;
drop policy if exists "user_update_own_messages" on public.orientacoes_expert;
drop policy if exists "admin_read_all_messages" on public.orientacoes_expert;
drop policy if exists "admin_insert_messages" on public.orientacoes_expert;
drop policy if exists "admin_update_all_messages" on public.orientacoes_expert;

-- Recriar políticas de usuário
create policy "user_read_own_messages"
on public.orientacoes_expert
for select
to authenticated
using (auth.uid() = user_id);

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

