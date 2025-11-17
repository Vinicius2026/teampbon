# 🔧 Instruções para Corrigir RLS de Orientações Expert

## 📋 Problema
O erro "new row violates row-level security policy" ocorre porque as políticas RLS não estão reconhecendo o usuário admin corretamente.

## ✅ Solução

### Passo 1: Executar o SQL de Correção

1. **Abra o Supabase SQL Editor**
2. **Execute o arquivo `SOLUCAO_COMPLETA_ORIENTACOES.sql`**

Este script vai:
- Criar uma função helper que verifica o role do admin diretamente na tabela `auth.users`
- Remover políticas antigas
- Criar novas políticas RLS corretas
- Verificar se tudo foi criado corretamente

### Passo 2: Verificar se o Admin está Configurado Corretamente

Execute este SQL no Supabase SQL Editor para verificar se seu usuário admin tem o role correto:

```sql
-- Verificar role do admin
SELECT 
  u.email,
  u.raw_app_meta_data->>'role' as role,
  u.id
FROM auth.users u
WHERE u.email = 'aurenospagamento@gmail.com'; -- Substitua pelo email do seu admin
```

**Se o `role` não for `'admin'`, execute:**

```sql
-- Configurar role do admin
UPDATE auth.users
SET raw_app_meta_data = jsonb_build_object('role', 'admin'),
    updated_at = now()
WHERE email = 'aurenospagamento@gmail.com'; -- Substitua pelo email do seu admin
```

### Passo 3: Fazer Logout e Login Novamente

**IMPORTANTE:** Após executar o SQL, você precisa:

1. **Fazer logout** do painel administrativo
2. **Fazer login novamente** para que o JWT seja atualizado com o role correto

### Passo 4: Testar a Função

Após fazer login como admin, execute este SQL para verificar se a função está funcionando:

```sql
-- Testar se a função reconhece você como admin
SELECT public.is_admin_user() as is_admin;
```

**Deve retornar `true` se você for admin.**

### Passo 5: Testar Envio de Mensagem

1. Acesse o painel administrativo
2. Vá para um usuário
3. Tente enviar uma mensagem na seção "Orientações Expert"
4. Se ainda der erro, verifique os passos anteriores

## 🔍 Troubleshooting

### Erro persiste após executar o SQL?

1. **Verifique se você fez logout e login novamente**
   - O JWT precisa ser atualizado após mudanças no `app_metadata`

2. **Verifique se o role está correto na tabela `auth.users`**
   ```sql
   SELECT email, raw_app_meta_data->>'role' as role
   FROM auth.users
   WHERE email = 'seu-email@admin.com';
   ```

3. **Teste a função diretamente**
   ```sql
   SELECT public.is_admin_user() as is_admin;
   ```

4. **Verifique se as políticas foram criadas**
   ```sql
   SELECT policyname, cmd, permissive
   FROM pg_policies 
   WHERE tablename = 'orientacoes_expert'
   ORDER BY policyname;
   ```

### A função retorna `false` mesmo sendo admin?

1. Verifique se o `raw_app_meta_data` tem o role `'admin'`
2. Execute o UPDATE do Passo 2 novamente
3. Faça logout e login novamente

## 📝 Notas Técnicas

- A função `is_admin_user()` usa `security definer`, o que permite que ela acesse a tabela `auth.users` mesmo quando chamada por políticas RLS
- A função verifica o role diretamente na tabela `auth.users`, não no JWT, tornando-a mais confiável
- As políticas RLS agora usam essa função para verificar se o usuário é admin

## ✅ Checklist

- [ ] Executei o SQL `SOLUCAO_COMPLETA_ORIENTACOES.sql`
- [ ] Verifiquei que o admin tem `role = 'admin'` na tabela `auth.users`
- [ ] Fiz logout do painel administrativo
- [ ] Fiz login novamente
- [ ] Testei a função `public.is_admin_user()` e retornou `true`
- [ ] Tentei enviar uma mensagem e funcionou

Se todos os itens estiverem marcados e ainda houver erro, verifique os logs do Supabase ou entre em contato para suporte adicional.

