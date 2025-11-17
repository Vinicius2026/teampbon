# 🔧 Instruções para Corrigir: Nome do Usuário na Dashboard

## 🎯 Problema
O nome está aparecendo como parte do email (ex: "teste10") ao invés do nome que o administrador definiu.

## ✅ Solução

### PASSO 1: Executar SQL no Supabase (OBRIGATÓRIO)

Execute este SQL no **SQL Editor** do Supabase:

```sql
-- ============================================================
-- CORREÇÃO DA VIEW user_profile (SEM fallback de email)
-- ============================================================
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
```

### PASSO 2: Corrigir Usuários Existentes (SE NECESSÁRIO)

Se você tem usuários que foram criados pelo admin mas o nome não está na tabela, execute:

```sql
-- Atualizar nome_completo na tabela consultoria_cadastros a partir do user_metadata
UPDATE public.consultoria_cadastros c
SET nome_completo = u.raw_user_meta_data->>'nome_completo'
FROM auth.users u
WHERE c.user_id = u.id
  AND (c.nome_completo IS NULL OR c.nome_completo = '')
  AND u.raw_user_meta_data->>'nome_completo' IS NOT NULL
  AND u.raw_user_meta_data->>'nome_completo' != '';
```

### PASSO 3: Fazer Deploy da Edge Function (OBRIGATÓRIO)

A Edge Function foi atualizada para garantir que o nome seja sempre salvo. Faça deploy:

**Opção 1: Via Supabase CLI**
```bash
supabase functions deploy create-user
```

**Opção 2: Via Dashboard**
1. Vá em **Edge Functions** → **create-user**
2. Substitua o código pelo conteúdo do arquivo `supabase/functions/create-user/index.ts`
3. Clique em **Deploy**

## 🔍 Verificar se Está Funcionando

### 1. Verificar se o nome está salvo:

```sql
-- Ver usuários e seus nomes
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'nome_completo' as metadata_nome,
  c.nome_completo as tabela_nome,
  c.user_id
FROM auth.users u
LEFT JOIN public.consultoria_cadastros c ON c.user_id = u.id
WHERE (u.raw_app_meta_data->>'role')::text = 'consultoria'
ORDER BY u.created_at DESC;
```

### 2. Testar na aplicação:

1. Faça login como um usuário criado pelo admin
2. Acesse `/dashboard`
3. Verifique se o nome aparece corretamente no sidebar (não o email)

## 📝 O que foi corrigido

### 1. View `user_profile`
- ❌ **Antes:** Usava email como fallback (`split_part(u.email, '@', 1)`)
- ✅ **Agora:** Não usa email como fallback, apenas `nome_completo` da tabela ou `user_metadata`

### 2. Frontend
- ❌ **Antes:** Usava email como fallback no código
- ✅ **Agora:** Usa apenas nome do banco ou "Usuário" (nunca o email)

### 3. Edge Function
- ✅ Atualizada para sempre salvar o nome quando criar usuário
- ✅ Atualizada para atualizar nome se registro existir mas não tiver nome

## ⚠️ Importante

1. **Execute o SQL do PASSO 1** - Isso remove o fallback do email da view
2. **Faça deploy da Edge Function** - Isso garante que novos usuários sempre terão nome salvo
3. **Execute o SQL do PASSO 2** - Isso corrige usuários existentes que não têm nome na tabela

## 🐛 Se ainda não funcionar

1. **Limpe o cache do navegador**
2. **Faça logout e login novamente**
3. **Verifique no console do navegador** se há erros
4. **Verifique no Supabase** se o nome está salvo corretamente (use as queries acima)

---

**Após executar estes passos, o nome do administrador aparecerá corretamente na dashboard!**

