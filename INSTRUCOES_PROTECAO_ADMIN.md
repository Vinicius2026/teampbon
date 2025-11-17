# Instruções: Proteção de Acesso Administrativo

## Problema Resolvido
Usuários comuns (não administradores) não conseguem mais acessar a área administrativa (`/adminseven`). Apenas usuários com `role: 'admin'` podem acessar.

## Como Funciona

### 1. Verificação no Frontend

#### `AdminLayout.tsx`
- Verifica se o usuário está autenticado
- Verifica se o usuário tem `role: 'admin'` no `app_metadata`
- Se não for admin, faz logout e redireciona para `/adminseven-login`
- Monitora mudanças na autenticação via `onAuthStateChange`

#### `AdminLogin.tsx`
- Verifica o role antes de permitir login
- Bloqueia login de usuários não-admin
- Exibe mensagem de erro apropriada

### 2. Verificação no Backend (Supabase)

A função RPC `is_admin_user()` verifica o role diretamente na tabela `auth.users`, o que é mais confiável que depender apenas do JWT.

## Configuração Necessária

### Passo 1: Executar Script SQL

Execute o script `VERIFICAR_ADMIN_ACCESS.sql` no Supabase SQL Editor para:
1. Criar/atualizar a função `is_admin_user()`
2. Verificar se existem usuários admin
3. Configurar o role do usuário admin (se necessário)

### Passo 2: Verificar/Configurar Usuário Admin

1. Acesse o Supabase Dashboard
2. Vá para Authentication > Users
3. Encontre o usuário admin
4. Verifique se `raw_app_meta_data` contém `{"role": "admin"}`

Se não tiver, execute no SQL Editor:
```sql
UPDATE auth.users
SET raw_app_meta_data = jsonb_build_object('role', 'admin'),
    updated_at = now()
WHERE email = 'SEU_EMAIL_ADMIN@exemplo.com';
```

### Passo 3: Testar

1. Faça login com um usuário comum em `/consultoria`
2. Tente acessar `http://localhost:8080/adminseven`
3. Você deve ser redirecionado para `/adminseven-login` com mensagem de erro
4. Faça login com o usuário admin em `/adminseven-login`
5. Você deve conseguir acessar `/adminseven` normalmente

## Comportamento Esperado

### Usuário Comum
- ✅ Pode acessar `/consultoria` e fazer login
- ✅ Pode acessar `/dashboard` (área do usuário)
- ❌ NÃO pode acessar `/adminseven` (é redirecionado para `/adminseven-login`)
- ❌ NÃO pode fazer login em `/adminseven-login` (recebe mensagem de erro)

### Usuário Admin
- ✅ Pode acessar `/adminseven-login` e fazer login
- ✅ Pode acessar `/adminseven` (área administrativa)
- ✅ Pode acessar todas as funcionalidades administrativas

## Troubleshooting

### Problema: Usuário comum ainda consegue acessar `/adminseven`

**Solução:**
1. Verifique se o script SQL foi executado
2. Verifique se o usuário admin tem `role: 'admin'` no `raw_app_meta_data`
3. Verifique os logs do console do navegador
4. Faça logout e login novamente para atualizar o JWT

### Problema: Admin não consegue acessar `/adminseven`

**Solução:**
1. Verifique se o usuário tem `role: 'admin'` no `raw_app_meta_data`
2. Execute o script SQL para atualizar o role
3. Faça logout e login novamente
4. Verifique os logs do console para ver qual verificação está falhando

### Problema: Função RPC `is_admin_user()` não existe

**Solução:**
1. Execute o script `VERIFICAR_ADMIN_ACCESS.sql`
2. Verifique se a função foi criada corretamente
3. Verifique se as permissões estão corretas (`grant execute`)

## Notas de Segurança

1. **Não confie apenas no frontend**: A verificação no frontend é uma camada de proteção, mas o backend (Supabase RLS) também deve estar configurado corretamente.

2. **JWT pode estar desatualizado**: Se o role do usuário foi alterado recentemente, o JWT pode não refletir a mudança imediatamente. A função RPC `is_admin_user()` verifica diretamente no banco de dados como fallback.

3. **Logout automático**: Quando um usuário comum tenta acessar a área administrativa, ele é automaticamente deslogado para garantir segurança.

## Arquivos Modificados

- `src/pages/adminseven/AdminLayout.tsx` - Adicionada verificação de role
- `src/pages/AdminLogin.tsx` - Melhorada verificação de role no login
- `VERIFICAR_ADMIN_ACCESS.sql` - Script SQL para configurar função RPC

