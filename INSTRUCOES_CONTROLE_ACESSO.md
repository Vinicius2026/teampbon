# Instruções - Sistema de Controle de Prazo de Validade de Acesso

## Visão Geral
Este sistema permite que o administrador defina um prazo de validade para o acesso de cada usuário (30 ou 90 dias) e adicione mais dias quando necessário. Quando o acesso expira, o usuário é bloqueado automaticamente, mas os dados são preservados.

## Passos para Implementação no Supabase

### 1. Executar Script SQL
Execute o script `SUPABASE_CONTROLE_ACESSO.sql` no SQL Editor do Supabase. Este script irá:

- Adicionar campos à tabela `consultoria_cadastros`:
  - `dias_acesso` (integer): Número de dias de acesso inicial (30 ou 90)
  - `data_expiracao` (date): Data de expiração calculada automaticamente
  - `dias_adicionais` (integer): Dias adicionais adicionados pelo administrador
  - `acesso_bloqueado` (boolean): Indica se o acesso foi bloqueado manualmente

- Criar funções SQL:
  - `calcular_data_expiracao()`: Calcula a data de expiração baseada nos dias de acesso
  - `acesso_valido()`: Verifica se o acesso está válido (não expirado e não bloqueado)

- Criar triggers:
  - `calcular_expiracao_insert`: Calcula data de expiração ao inserir registro
  - `calcular_expiracao_update`: Recalcula data de expiração ao atualizar dias

- Atualizar view `user_profile`:
  - Adiciona campos de controle de acesso
  - Inclui função `acesso_valido()` para verificação rápida

- Atualizar registros existentes:
  - Define 30 dias de acesso padrão para usuários existentes
  - Calcula data de expiração baseada na data atual

### 2. Verificar RLS Policies
Certifique-se de que as políticas RLS permitem:
- Administradores podem ler e atualizar todos os registros de `consultoria_cadastros`
- Usuários autenticados podem ler apenas seus próprios registros

### 3. Testar Funcionalidades

#### Criar Novo Usuário
1. Acesse a área administrativa
2. No formulário "Criar Novo Usuário":
   - Preencha nome completo
   - Preencha email
   - Selecione 30 ou 90 dias de acesso
   - Clique em "Criar Usuário"
3. O sistema criará o usuário com a data de expiração calculada automaticamente

#### Adicionar Mais Dias
1. Acesse o perfil do usuário na área administrativa
2. Na seção "Controle de Acesso":
   - Visualize informações de acesso (dias inicial, dias adicionais, data de expiração, status)
   - Digite o número de dias a adicionar
   - Clique em "Adicionar Dias"
3. A data de expiração será atualizada automaticamente

#### Verificar Expiração
1. O sistema verifica automaticamente a expiração no login
2. Se o acesso estiver expirado ou bloqueado:
   - O usuário não consegue fazer login
   - Uma mensagem de erro é exibida
   - O usuário é deslogado automaticamente
3. Na dashboard, o acesso também é verificado:
   - Se expirado, o usuário é redirecionado para a página de login
   - Uma mensagem de erro é exibida

## Funcionalidades Implementadas

### Área Administrativa
- **Criar Usuário**: Campo para selecionar 30 ou 90 dias de acesso
- **Lista de Usuários**: Exibe informações de acesso (data de expiração, dias restantes, status)
- **Perfil do Usuário**: 
  - Seção "Controle de Acesso" com informações detalhadas
  - Campo para adicionar mais dias
  - Visualização de status (Ativo, Expirado, Bloqueado)

### Área do Usuário
- **Login**: Verificação automática de expiração e bloqueio
- **Dashboard**: Verificação contínua de acesso válido
- **Redirecionamento**: Automático para login se acesso expirado

## Campos no Banco de Dados

### Tabela: `consultoria_cadastros`
- `dias_acesso` (integer, default: 30): Dias de acesso inicial
- `data_expiracao` (date): Data de expiração (calculada automaticamente)
- `dias_adicionais` (integer, default: 0): Dias adicionais adicionados
- `acesso_bloqueado` (boolean, default: false): Status de bloqueio manual

## Lógica de Cálculo

### Data de Expiração
- **Ao criar usuário**: `data_expiracao = hoje + dias_acesso`
- **Ao adicionar dias**: `nova_data_expiracao = data_expiracao_atual + dias_adicionar`
- **Dias totais**: `dias_totais = dias_acesso + dias_adicionais`

### Verificação de Acesso
Um acesso é considerado válido se:
1. `acesso_bloqueado = false`
2. `data_expiracao >= hoje`

## Notas Importantes

1. **Preservação de Dados**: Os dados do usuário são preservados mesmo após expiração do acesso. Apenas o acesso é bloqueado.

2. **Renovação de Acesso**: O administrador pode adicionar mais dias a qualquer momento, mesmo após a expiração, para reativar o acesso.

3. **Bloqueio Manual**: O campo `acesso_bloqueado` permite bloqueio manual pelo administrador, independente da data de expiração.

4. **Registros Existentes**: Usuários existentes receberão 30 dias de acesso padrão a partir da data de execução do script SQL.

5. **View user_profile**: A view foi atualizada para incluir informações de acesso, facilitando consultas no frontend.

## Troubleshooting

### Problema: Data de expiração não está sendo calculada
- Verifique se os triggers foram criados corretamente
- Verifique se a função `calcular_data_expiracao()` está funcionando
- Verifique os logs do Supabase para erros

### Problema: Usuário consegue acessar mesmo com acesso expirado
- Verifique se a verificação está sendo feita no `ConsultoriaLogin.tsx`
- Verifique se a verificação está sendo feita no `UserDashboardLayout.tsx`
- Verifique se a data de expiração está sendo comparada corretamente (usando apenas a data, sem hora)

### Problema: Não consigo adicionar dias
- Verifique se o campo `dias_adicionais` está sendo atualizado corretamente
- Verifique se o trigger `calcular_expiracao_update` está recalculando a data
- Verifique os logs do Supabase para erros

## Próximos Passos (Opcional)

1. **Notificações**: Enviar email ao usuário quando o acesso estiver próximo de expirar (ex: 7 dias antes)
2. **Histórico**: Criar tabela de histórico de renovações de acesso
3. **Relatórios**: Criar relatório de usuários com acesso próximo de expirar
4. **Renovação Automática**: Permitir renovação automática para certos tipos de usuários

