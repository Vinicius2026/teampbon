# Instruções - Calcular Data de Expiração Automaticamente

## Problema Resolvido
O sistema agora calcula automaticamente a data de expiração baseado em:
- **Dias de acesso inicial** (30 ou 90 dias definidos pelo administrador)
- **Dias adicionais** (dias extras adicionados pelo administrador)
- **Data de criação** do registro (se disponível)

## Solução Implementada

### 1. Cálculo Automático no Frontend
O componente `UserDetail.tsx` agora:
- Calcula a data de expiração se não estiver salva no banco
- Usa `created_at + dias_acesso + dias_adicionais` quando `created_at` está disponível
- Salva automaticamente a data calculada no banco de dados
- Exibe a data e dias restantes corretamente

### 2. Trigger SQL Melhorado
O trigger `trigger_calcular_expiracao()` foi atualizado para:
- Calcular data de expiração quando `dias_acesso` ou `dias_adicionais` mudam
- Calcular data de expiração quando `data_expiracao` está null mas `dias_acesso` está definido
- Usar `created_at` quando disponível, senão usar `current_date`

### 3. Script de Correção
O script `CORRIGIR_DATA_EXPIRACAO.sql` corrige registros existentes que:
- Têm `dias_acesso` mas não têm `data_expiracao`
- Têm `user_id` mas não têm `dias_acesso` ou `data_expiracao`

## Passos para Aplicar

### 1. Executar Script SQL de Correção
Execute o script `CORRIGIR_DATA_EXPIRACAO.sql` no SQL Editor do Supabase para corrigir registros existentes:

```sql
-- Este script calcula e atualiza a data de expiração para registros
-- que têm dias_acesso definido mas não têm data_expiracao
```

### 2. Atualizar Trigger SQL
Execute a parte do script `SUPABASE_CONTROLE_ACESSO.sql` que atualiza o trigger (se ainda não foi executado):

```sql
-- 6) Trigger para calcular data de expiração automaticamente
create or replace function public.trigger_calcular_expiracao()
...
```

### 3. Verificar Funcionamento
1. Acesse um perfil de usuário na área administrativa
2. Verifique se a data de expiração está sendo exibida
3. Verifique se os dias restantes estão corretos
4. Adicione mais dias e verifique se a data é atualizada

## Lógica de Cálculo

### Quando `created_at` está disponível:
```
data_expiracao = created_at + dias_acesso + dias_adicionais
```

### Quando `created_at` não está disponível:
```
data_expiracao = current_date + dias_acesso + dias_adicionais
```

### Exemplo:
- Usuário criado em: 01/01/2025
- Dias de acesso: 30
- Dias adicionais: 0
- **Data de expiração**: 31/01/2025

Se o administrador adicionar 15 dias:
- Dias adicionais: 15
- **Nova data de expiração**: 15/02/2025 (31/01 + 15 dias)

## Comportamento do Sistema

### Ao Criar Novo Usuário:
1. Administrador define dias de acesso (30 ou 90)
2. Edge Function calcula: `hoje + dias_acesso`
3. Data é salva no banco de dados
4. Trigger garante que a data seja calculada corretamente

### Ao Adicionar Dias:
1. Administrador adiciona dias no perfil do usuário
2. Sistema atualiza: `data_expiracao_atual + dias_adicionar`
3. `dias_adicionais` é incrementado
4. Data é atualizada no banco

### Ao Visualizar Perfil:
1. Sistema verifica se `data_expiracao` está salva
2. Se não estiver, calcula baseado em `created_at + dias_acesso + dias_adicionais`
3. Se `created_at` não estiver disponível, calcula baseado em `hoje + dias_acesso + dias_adicionais`
4. Salva a data calculada no banco (se necessário)
5. Exibe a data e dias restantes

## Troubleshooting

### Problema: Data ainda aparece como "Não definida"
**Solução:**
1. Execute o script `CORRIGIR_DATA_EXPIRACAO.sql`
2. Verifique se o usuário tem `dias_acesso` definido
3. Verifique se o trigger está funcionando corretamente
4. Recarregue a página do perfil do usuário

### Problema: Data calculada está incorreta
**Solução:**
1. Verifique se `created_at` está correto no banco
2. Verifique se `dias_acesso` e `dias_adicionais` estão corretos
3. Execute o script de correção novamente

### Problema: Data não é atualizada ao adicionar dias
**Solução:**
1. Verifique se o trigger está ativo
2. Verifique os logs do Supabase para erros
3. Tente atualizar manualmente a data no banco

## Notas Importantes

1. **Preservação de Dados**: A data de expiração é calculada automaticamente, mas pode ser ajustada manualmente pelo administrador se necessário.

2. **Registros Antigos**: Usuários criados antes da implementação do sistema de controle de acesso receberão 30 dias de acesso padrão a partir da data de execução do script de correção.

3. **Precisão**: O cálculo usa apenas a data (sem horas), então a comparação é feita no nível de dias.

4. **Performance**: O cálculo é feito no frontend para exibição imediata, e a data é salva no banco de forma assíncrona para evitar bloqueios.

## Próximos Passos

Após aplicar as correções:
1. Verifique todos os usuários na área administrativa
2. Confirme que todas as datas de expiração estão sendo exibidas
3. Teste adicionar dias a um usuário
4. Verifique se os dias restantes estão corretos

