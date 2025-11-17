# Correção - Formulário 1 Não Aparece Disponível

## Problema Identificado
O formulário 1 não estava aparecendo como disponível para preenchimento.

## Correções Aplicadas

### 1. Função SQL Simplificada
Criei o arquivo `SUPABASE_ACOMPANHAMENTO_NOVO_FIXED.sql` com a função `formularios_disponiveis()` simplificada que:
- Garante que o formulário 1 sempre tenha `data_desbloqueio` calculada
- Marca o formulário 1 como `desbloqueado = true` e `pode_preencher = true` se não estiver preenchido e acesso válido
- Remove blocos `declare` aninhados que causavam problemas

### 2. Frontend com Fallback
O componente `Home.tsx` agora:
- Tem fallback para criar estrutura básica com formulário 1 disponível se a função SQL falhar
- Permite expandir o formulário 1 mesmo se `pode_preencher` for false (tratamento especial)
- Mostra o formulário 1 como editável mesmo quando a função SQL não retorna dados corretos
- Adiciona logs de debug no console

### 3. Lógica de Expansão Corrigida
- O botão permite expandir se `formulario_numero === 1`, mesmo que outros flags estejam false
- O formulário 1 sempre mostra o formulário completo quando expandido, se não estiver preenchido

## Passos para Resolver

### 1. Executar Script SQL Corrigido
Execute o arquivo `SUPABASE_ACOMPANHAMENTO_NOVO_FIXED.sql` no SQL Editor do Supabase.

Este script:
- Recria a função `formularios_disponiveis()` com lógica simplificada
- Garante que o formulário 1 sempre retorne `desbloqueado = true` e `pode_preencher = true` se condições forem atendidas
- Remove problemas de sintaxe com blocos `declare` aninhados

### 2. Verificar Console do Navegador
1. Abra o console do navegador (F12)
2. Acesse `/dashboard`
3. Verifique os logs:
   - "Carregando formulários para user_id: ..."
   - "Dados retornados da função: ..."
   - "Formulários ordenados: ..."

### 3. Verificar Dados no Banco
Execute esta query no Supabase para verificar se o usuário tem dados corretos:

```sql
-- Verificar dados do usuário
select 
  u.id,
  u.email,
  u.created_at as user_created_at,
  c.created_at as cadastro_created_at,
  c.data_expiracao,
  c.dias_acesso,
  c.user_id
from auth.users u
left join public.consultoria_cadastros c on c.user_id = u.id
where u.email = 'SEU_EMAIL_AQUI';

-- Testar função diretamente
select * from public.formularios_disponiveis('USER_ID_AQUI');
```

### 4. Verificar Permissões
Certifique-se de que a função tem permissões corretas:

```sql
-- Verificar permissões
grant execute on function public.formularios_disponiveis(uuid) to authenticated;
grant execute on function public.calcular_data_desbloqueio_formulario(uuid, integer) to authenticated;
```

## Possíveis Causas do Problema

1. **Função SQL não está retornando dados**: A função pode estar falhando silenciosamente
2. **Data de criação não encontrada**: O usuário pode não ter `created_at` em `consultoria_cadastros` ou `auth.users`
3. **Acesso expirado**: Se `data_expiracao` estiver no passado, o formulário não aparecerá como disponível
4. **Problema de permissões**: A função pode não ter permissão para acessar `auth.users` ou `consultoria_cadastros`

## Solução de Fallback Implementada

O frontend agora tem um fallback que:
- Se a função SQL falhar ou não retornar dados, cria estrutura básica com formulário 1 disponível
- Permite que o usuário preencha o formulário 1 mesmo se a função SQL não funcionar
- Adiciona logs detalhados para debug

## Teste Rápido

1. Acesse `/dashboard` como usuário
2. Abra o console do navegador (F12)
3. Verifique se aparecem 4 formulários
4. O formulário 1 deve estar com badge "🔓 Disponível" (azul)
5. Clique no formulário 1 para expandir
6. Verifique se o formulário completo aparece e pode ser preenchido

## Se Ainda Não Funcionar

1. Verifique os logs no console do navegador
2. Execute a função SQL diretamente no Supabase para ver o que retorna
3. Verifique se o usuário tem `user_id` em `consultoria_cadastros`
4. Verifique se `created_at` está definido em `consultoria_cadastros` ou `auth.users`
5. Verifique se `data_expiracao` não está no passado

## Próximos Passos

Após executar o script corrigido:
1. Teste criando um novo usuário
2. Verifique se o formulário 1 aparece imediatamente
3. Preencha o formulário 1
4. Verifique se o formulário 2 desbloqueia após 2 dias (ou ajuste a data no banco para testar)

