-- TESTE: Remover todas policies e criar uma temporária super permissiva para authenticated
drop policy if exists "allow_admin_select" on public.consultoria_cadastros;

-- Policy temporária: qualquer usuário autenticado pode ler (para teste)
create policy "temp_allow_all_authenticated_select"
on public.consultoria_cadastros
for select
to authenticated
using (true);

-- Verificar o role no JWT em tempo real
-- (rode essa query depois de fazer login no admin)
select 
  auth.uid() as user_id,
  auth.jwt() ->> 'role' as jwt_role,
  auth.jwt() as full_jwt;

