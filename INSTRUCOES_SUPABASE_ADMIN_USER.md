# Instruções para Configuração no Supabase

## 📋 O que foi implementado

Foi implementado um sistema onde o administrador pode criar novos usuários diretamente na área administrativa. Esses usuários recebem credenciais de acesso (e-mail e senha padrão `teampb2025`) e precisam completar um formulário de cadastro após o primeiro login.

## 🗄️ Modificações no Banco de Dados

### 1. Execute o SQL no Supabase

Execute o arquivo `SUPABASE_ADMIN_CREATE_USER.sql` no SQL Editor do Supabase. Este script:

- Adiciona campo `user_id` na tabela `consultoria_cadastros`
- Adiciona campo `form_preenchido` (boolean) para indicar se formulário foi completado
- Cria índices para melhor performance
- Atualiza policies RLS para permitir que usuários autenticados leiam/atualizem seus próprios registros
- Atualiza a view `user_profile` para incluir `form_preenchido`
- Cria view `admin_users_view` para admin ver todos os usuários com status do formulário

### 2. Verificar Edge Function

Certifique-se de que a Edge Function `create-user` está deployada e funcionando. Ela foi modificada para:

- Criar usuário no `auth.users`
- Criar registro inicial em `consultoria_cadastros` com `status='pending'` e `form_preenchido=false`

**Como verificar:**
1. Vá em **Edge Functions** no dashboard do Supabase
2. Verifique se `create-user` está na lista
3. Se não estiver, faça deploy usando o código em `supabase/functions/create-user/index.ts`

**Como fazer deploy:**
```bash
# Se você tem Supabase CLI instalado
supabase functions deploy create-user
```

Ou copie o código do arquivo e crie manualmente no dashboard do Supabase.

### 3. Verificar Policies RLS

Após executar o SQL, verifique se as policies estão corretas:

```sql
-- Verificar policies da tabela consultoria_cadastros
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'consultoria_cadastros';
```

Você deve ver:
- `allow_anon_insert` - permite inserção anônima (formulário público)
- `allow_admin_select` - admin pode ler todos
- `allow_admin_update` - admin pode atualizar todos
- `allow_admin_delete` - admin pode deletar todos
- `user_read_own_cadastro` - usuário pode ler seu próprio cadastro
- `user_update_own_cadastro` - usuário pode atualizar seu próprio cadastro
- `user_insert_own_cadastro` - usuário pode inserir seu próprio cadastro

## 🔄 Fluxo Completo

### 1. Admin cria usuário
- Admin acessa `/adminseven`
- Clica em "Criar Novo Usuário"
- Informa e-mail
- Sistema cria usuário no `auth.users` com role `consultoria`
- Sistema cria registro em `consultoria_cadastros` com:
  - `user_id` = ID do usuário criado
  - `email` = e-mail informado
  - `status` = `pending`
  - `form_preenchido` = `false`

### 2. Usuário faz login
- Usuário acessa `/consultoria`
- Informa e-mail e senha (`teampb2025`)
- Sistema verifica se `form_preenchido = true`
- Se `false` ou `null`, redireciona para `/consultoria-cadastro`
- Se `true`, redireciona para `/dashboard`

### 3. Usuário preenche formulário
- Usuário preenche formulário em `/consultoria-cadastro`
- Sistema salva/atualiza registro em `consultoria_cadastros` com:
  - Todos os dados do formulário
  - `form_preenchido` = `true`
  - `user_id` = ID do usuário autenticado
- Sistema redireciona para `/dashboard`

### 4. Admin visualiza usuário
- Admin vê lista de usuários em `/adminseven`
- Status do formulário é exibido:
  - ⚠️ "Usuário ainda não completou formulário" (se `form_preenchido = false`)
  - ✅ "Formulário completado" (se `form_preenchido = true`)
- Ao clicar em "Ver", admin vê:
  - Se formulário não foi preenchido: mensagem de aviso
  - Se formulário foi preenchido: todos os dados do formulário

## ⚠️ Pontos de Atenção

### 1. Senha Padrão
A senha padrão é `teampb2025`. Esta senha é:
- Usada quando admin cria novo usuário
- Exibida no formulário de criação
- Enviada ao admin após criação bem-sucedida

**Recomendação:** Considere implementar alteração de senha no primeiro login ou envio de e-mail com link de redefinição.

### 2. Edge Function
A Edge Function `create-user` precisa de:
- `SUPABASE_URL` (variável de ambiente)
- `SUPABASE_SERVICE_ROLE_KEY` (variável de ambiente)

**Como configurar no Supabase:**
1. Vá em **Edge Functions** → **create-user**
2. Vá em **Settings** → **Secrets**
3. Adicione as secrets:
   - `SUPABASE_URL` = sua URL do Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` = sua Service Role Key (encontrada em Settings → API)

### 3. RLS (Row Level Security)
As policies RLS garantem que:
- Usuários só veem seus próprios dados
- Admin vê todos os dados
- Usuários podem atualizar apenas seus próprios registros

**Importante:** Se houver problemas de permissão, verifique:
1. Se RLS está habilitado na tabela
2. Se as policies estão corretas
3. Se o JWT do usuário contém o role correto

### 4. Migração de Dados Existentes
Se você já tem usuários no sistema, você pode precisar:

1. **Associar user_id aos registros existentes:**
```sql
-- Atualizar registros existentes com user_id baseado no email
UPDATE public.consultoria_cadastros c
SET user_id = u.id
FROM auth.users u
WHERE c.email = u.email
  AND c.user_id IS NULL;
```

2. **Marcar registros existentes como preenchidos:**
```sql
-- Se os registros existentes já têm dados completos, marcar como preenchidos
UPDATE public.consultoria_cadastros
SET form_preenchido = true
WHERE nome_completo IS NOT NULL
  AND nome_completo != ''
  AND form_preenchido IS NULL;
```

## 🧪 Como Testar

### 1. Teste de Criação de Usuário
1. Acesse `/adminseven` como admin
2. Crie um novo usuário com e-mail de teste
3. Verifique no Supabase Dashboard:
   - Usuário foi criado em `auth.users`
   - Registro foi criado em `consultoria_cadastros` com `user_id` e `form_preenchido = false`

### 2. Teste de Login
1. Acesse `/consultoria`
2. Faça login com e-mail criado e senha `teampb2025`
3. Deve redirecionar para `/consultoria-cadastro`

### 3. Teste de Preenchimento
1. Preencha o formulário em `/consultoria-cadastro`
2. Salve o formulário
3. Verifique no Supabase:
   - `form_preenchido` = `true`
   - Dados do formulário foram salvos

### 4. Teste de Dashboard
1. Faça login novamente
2. Deve redirecionar para `/dashboard` (não para cadastro)

### 5. Teste de Visualização Admin
1. Acesse `/adminseven` como admin
2. Verifique se status do formulário é exibido
3. Clique em "Ver" no usuário
4. Verifique se formulário é exibido (se preenchido) ou mensagem (se não preenchido)

## 📝 Notas Finais

- Todos os usuários criados pelo admin começam com `status = 'pending'`
- Admin pode aprovar/reprovar usuários normalmente
- Sistema mantém compatibilidade com fluxo antigo (cadastro público sem autenticação)
- View `admin_users_view` pode ser usada para relatórios e análises

## 🐛 Troubleshooting

### Erro: "Failed to send a request to the Edge Function"
- Verifique se a Edge Function está deployada
- Verifique se as secrets estão configuradas
- Verifique os logs da Edge Function no dashboard

### Erro: "Permission denied"
- Verifique se RLS está habilitado
- Verifique se as policies estão corretas
- Verifique se o usuário tem o role correto no JWT

### Usuário não aparece na lista
- Verifique se o registro foi criado em `consultoria_cadastros`
- Verifique se o `status` está como `pending` ou `approved`
- Verifique se a query está filtrando corretamente

### Formulário não salva
- Verifique se o usuário está autenticado
- Verifique se o `user_id` está sendo passado
- Verifique as policies de UPDATE na tabela
- Verifique os logs do Supabase

---

**Última atualização:** $(date)
**Versão:** 1.0

