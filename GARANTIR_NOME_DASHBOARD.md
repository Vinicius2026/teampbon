# ✅ Garantir que Nome Apareça na Dashboard do Usuário

## 🎯 Problema
O nome do usuário não está aparecendo na dashboard, mostrando apenas "Usuário" como fallback.

## 🔧 Solução

### 1. Execute o SQL no Supabase (OBRIGATÓRIO)

Execute o arquivo `FIX_USER_PROFILE_VIEW.sql` no SQL Editor do Supabase. Este script:

- Remove a view antiga `user_profile` (se existir)
- Cria uma nova view `user_profile` que:
  1. **Prioriza** `nome_completo` da tabela `consultoria_cadastros` (via `user_id`)
  2. **Fallback 1:** `nome_completo` do `user_metadata` do `auth.users`
  3. **Fallback 2:** Parte do email (antes do @)

### 2. Verificar se o Nome está Salvo

Para usuários criados pelo admin:

1. **Verificar no `auth.users`:**
   - Vá em **Authentication** → **Users**
   - Encontre o usuário
   - Verifique se `user_metadata.nome_completo` contém o nome

2. **Verificar na tabela `consultoria_cadastros`:**
   - Vá em **Table Editor** → `consultoria_cadastros`
   - Encontre o registro do usuário (pelo `user_id` ou `email`)
   - Verifique se o campo `nome_completo` contém o nome

### 3. Se o Nome Não Estiver Salvo

#### Para Usuários Novos (criados pelo admin):
- O nome deve ser salvo automaticamente quando o admin cria o usuário
- Verifique se a Edge Function `create-user` está atualizada e funcionando

#### Para Usuários Existentes (que não têm nome):
Execute este SQL para atualizar usuários existentes:

```sql
-- Atualizar nome_completo na tabela consultoria_cadastros a partir do user_metadata
UPDATE public.consultoria_cadastros c
SET nome_completo = u.raw_user_meta_data->>'nome_completo'
FROM auth.users u
WHERE c.user_id = u.id
  AND (c.nome_completo IS NULL OR c.nome_completo = '')
  AND u.raw_user_meta_data->>'nome_completo' IS NOT NULL;

-- Atualizar user_metadata a partir da tabela consultoria_cadastros (se necessário)
-- Nota: Isso requer usar a API do Supabase ou Edge Function, não pode ser feito via SQL direto
```

### 4. Testar

1. **Faça login como usuário criado pelo admin**
2. **Acesse `/dashboard`**
3. **Verifique se o nome aparece no sidebar (lateral esquerda)**

## 🔍 Troubleshooting

### Problema: Nome ainda aparece como "Usuário"

**Causa 1:** View não foi atualizada
- **Solução:** Execute o SQL `FIX_USER_PROFILE_VIEW.sql`

**Causa 2:** Nome não está salvo no banco
- **Solução:** Verifique se o nome está em `consultoria_cadastros.nome_completo` ou `auth.users.user_metadata.nome_completo`
- Se não estiver, atualize manualmente ou recrie o usuário

**Causa 3:** Edge Function não está salvando o nome
- **Solução:** Verifique se a Edge Function `create-user` está atualizada e fazendo deploy

**Causa 4:** Join não está funcionando
- **Solução:** Verifique se o `user_id` na tabela `consultoria_cadastros` está correto e corresponde ao `id` em `auth.users`

### Problema: Nome aparece mas está errado

**Causa:** Nome foi atualizado em um lugar mas não no outro
- **Solução:** Atualize ambos os lugares:
  1. Tabela `consultoria_cadastros.nome_completo`
  2. `auth.users.user_metadata.nome_completo`

### Problema: View retorna erro

**Causa:** Permissões ou sintaxe incorreta
- **Solução:** 
  1. Verifique se a view foi criada corretamente
  2. Verifique se o usuário tem permissão para acessar a view
  3. Verifique os logs do Supabase

## 📝 Verificação Rápida

Execute este SQL para verificar se a view está funcionando:

```sql
-- Verificar dados da view user_profile para o usuário atual
SELECT * FROM public.user_profile;

-- Verificar se há registros na tabela consultoria_cadastros com user_id
SELECT 
  c.id,
  c.user_id,
  c.email,
  c.nome_completo,
  u.email as user_email,
  u.raw_user_meta_data->>'nome_completo' as metadata_nome
FROM public.consultoria_cadastros c
LEFT JOIN auth.users u ON u.id = c.user_id
WHERE c.user_id IS NOT NULL
LIMIT 10;
```

## ✅ Checklist

- [ ] Executei o SQL `FIX_USER_PROFILE_VIEW.sql`
- [ ] Verifiquei se o nome está salvo em `consultoria_cadastros.nome_completo`
- [ ] Verifiquei se o nome está salvo em `auth.users.user_metadata.nome_completo`
- [ ] Testei fazendo login e verificando se o nome aparece
- [ ] Se não aparecer, verifiquei os logs do console do navegador
- [ ] Se necessário, atualizei usuários existentes com o SQL de atualização

## 🎯 Resultado Esperado

Após seguir estes passos, o nome do usuário deve aparecer corretamente na dashboard:

- ✅ Nome aparece no sidebar (lateral esquerda)
- ✅ Nome é buscado da view `user_profile`
- ✅ View prioriza nome da tabela `consultoria_cadastros`
- ✅ Fallback funciona se nome não estiver na tabela

---

**Última atualização:** $(date)
**Versão:** 1.0

