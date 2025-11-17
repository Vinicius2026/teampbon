# ✅ Atualização: Campo de Nome no Cadastro de Usuários

## 📋 O que foi implementado

Foi adicionado um campo de **Nome Completo** no formulário de criação de usuários pelo administrador. Agora o admin deve informar:
1. **Nome Completo** (primeiro e sobrenome)
2. **Email**

O nome será salvo tanto no `user_metadata` do `auth.users` quanto no campo `nome_completo` da tabela `consultoria_cadastros`, garantindo que apareça corretamente na dashboard do usuário.

## 🔄 Modificações Realizadas

### 1. Frontend - Dashboard Admin
**Arquivo:** `src/pages/adminseven/Dashboard.tsx`
- ✅ Adicionado campo "Nome Completo" no formulário de criação
- ✅ Validação para garantir que o nome seja informado
- ✅ Campo nome aparece antes do campo email
- ✅ Nome é enviado para a Edge Function

### 2. Backend - Edge Function
**Arquivo:** `supabase/functions/create-user/index.ts`
- ✅ Adicionado parâmetro `nome_completo` na função
- ✅ Validação para garantir que nome seja informado
- ✅ Nome salvo no `user_metadata` do `auth.users`
- ✅ Nome salvo no campo `nome_completo` da tabela `consultoria_cadastros`

### 3. Banco de Dados - Views
**Arquivo:** `SUPABASE_ADMIN_CREATE_USER.sql`
- ✅ View `user_profile` atualizada para priorizar `nome_completo` da tabela `consultoria_cadastros`
- ✅ Fallback para `user_metadata` se não houver nome na tabela
- ✅ View `admin_users_view` atualizada da mesma forma

## 🗄️ O que fazer no Supabase

### 1. Atualizar Views (OBRIGATÓRIO)

Execute o seguinte SQL no SQL Editor do Supabase para atualizar as views:

```sql
-- Atualizar view user_profile para priorizar nome_completo da tabela
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

-- Atualizar view admin_users_view para priorizar nome_completo da tabela
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
```

### 2. Atualizar Edge Function (OBRIGATÓRIO)

**Importante:** Você precisa fazer deploy da Edge Function atualizada!

**Opção 1: Via Supabase CLI**
```bash
supabase functions deploy create-user
```

**Opção 2: Via Dashboard do Supabase**
1. Vá em **Edge Functions** → **create-user**
2. Substitua o código pelo conteúdo do arquivo `supabase/functions/create-user/index.ts`
3. Clique em **Deploy**

## 🔄 Como Funciona Agora

### Fluxo de Criação de Usuário

1. **Admin acessa `/adminseven`**
2. **Admin preenche formulário:**
   - Nome Completo: "João Silva"
   - Email: "joao@email.com"
3. **Sistema cria usuário:**
   - Salva nome no `user_metadata` do `auth.users`
   - Salva nome no campo `nome_completo` da tabela `consultoria_cadastros`
   - Cria registro com `status = 'pending'` e `form_preenchido = false`
4. **Usuário faz login:**
   - Nome aparece na dashboard do usuário (lateral esquerda)
   - Se formulário não foi preenchido, nome já aparece porque está salvo na tabela

### Prioridade do Nome

A view `user_profile` usa a seguinte prioridade:
1. **Primeiro:** Nome da tabela `consultoria_cadastros` (campo `nome_completo`)
2. **Segundo:** Nome do `user_metadata` do `auth.users`

Isso significa que:
- Se o admin definiu um nome, ele aparecerá na dashboard
- Se o usuário preencher o formulário e atualizar o nome, o nome atualizado aparecerá
- Se não houver nome na tabela, o nome do `user_metadata` será usado como fallback

## ✅ Checklist

- [x] Campo de nome adicionado no formulário do admin
- [x] Validação de nome implementada
- [x] Nome salvo no `user_metadata` do `auth.users`
- [x] Nome salvo no campo `nome_completo` da tabela `consultoria_cadastros`
- [x] Views atualizadas para priorizar nome da tabela
- [x] Edge Function atualizada para receber e salvar nome
- [ ] **Você precisa:** Executar SQL para atualizar views
- [ ] **Você precisa:** Fazer deploy da Edge Function atualizada

## 🧪 Como Testar

1. **Acesse `/adminseven` como admin**
2. **Crie um novo usuário:**
   - Preencha o campo "Nome Completo" (ex: "Maria Santos")
   - Preencha o campo "Email" (ex: "maria@email.com")
   - Clique em "Criar Usuário"
3. **Verifique no Supabase:**
   - Vá em **Authentication** → **Users**
   - Encontre o usuário criado
   - Verifique se `user_metadata.nome_completo` contém o nome
   - Vá em **Table Editor** → `consultoria_cadastros`
   - Verifique se o campo `nome_completo` contém o nome
4. **Faça login como o usuário criado:**
   - Acesse `/consultoria`
   - Faça login com email e senha `teampb2025`
   - Verifique se o nome aparece na dashboard (lateral esquerda)

## 📝 Notas Importantes

1. **Nome é obrigatório:** O campo nome completo é obrigatório no formulário de criação
2. **Nome aparece imediatamente:** O nome aparece na dashboard do usuário mesmo antes dele preencher o formulário
3. **Nome pode ser atualizado:** Se o usuário preencher o formulário e informar um nome diferente, o nome será atualizado na tabela
4. **Prioridade:** A view prioriza o nome da tabela `consultoria_cadastros` sobre o `user_metadata`

## 🐛 Troubleshooting

### Problema: Nome não aparece na dashboard
- Verifique se executou o SQL para atualizar as views
- Verifique se o nome foi salvo na tabela `consultoria_cadastros`
- Verifique se o nome foi salvo no `user_metadata` do `auth.users`

### Problema: Edge Function não recebe nome
- Verifique se fez deploy da Edge Function atualizada
- Verifique os logs da Edge Function no dashboard do Supabase
- Verifique se o campo nome está sendo enviado do frontend

### Problema: Erro ao criar usuário
- Verifique se o campo nome está preenchido
- Verifique se o email é válido
- Verifique os logs da Edge Function

---

**Data da atualização:** $(date)
**Versão:** 1.1

