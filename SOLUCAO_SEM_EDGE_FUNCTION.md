# Solução: Aprovar usuário sem Edge Function

## Problema
A Edge Function `create-user` não está acessível. Erro: "Failed to send a request to the Edge Function"

## Solução Alternativa (2 opções)

### Opção 1: Enviar email com link de cadastro (RECOMENDADA)
Em vez de criar o usuário automaticamente, envie um email ao usuário aprovado com um link para ele criar sua própria senha.

**Vantagens:**
- Mais seguro (usuário escolhe a senha)
- Não precisa de Edge Function
- Usuário recebe confirmação por email

### Opção 2: Usar convite do Supabase Auth
O Supabase tem um recurso de "invite user" que envia email automaticamente.

**Como implementar:**
1. No dashboard do Supabase: Authentication > Users > Invite
2. Ou via API Admin (requer configurar Email Templates no Supabase)

### Opção 3: Criar usuário via Service Role no Backend (Segura)
Criar um endpoint backend próprio (não Edge Function do Supabase) que:
1. Recebe o email do admin
2. Usa service_role para criar usuário
3. Retorna sucesso

**Importante:** NUNCA exponha service_role no frontend.

## O que fazer agora?

### Verificar se a Edge Function existe:
1. Supabase Dashboard → Edge Functions
2. Verificar se `create-user` está na lista
3. Verificar se está "Deployed"

### Se a function existe mas não funciona:
1. Verificar logs: Edge Functions → create-user → Logs
2. Verificar secrets: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
3. Testar a function manualmente no dashboard

### Se a function não existe:
Rode no terminal (Supabase CLI):
```bash
supabase functions deploy create-user
```

Ou crie via dashboard e cole o código que passei anteriormente.

## Solução TEMPORÁRIA (para teste)
Marcar como aprovado SEM criar usuário no Auth. O admin cria manualmente no Supabase Dashboard.

Quer que eu implemente alguma dessas alternativas?

