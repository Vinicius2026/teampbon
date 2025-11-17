# Instruções - Novo Sistema de Acompanhamento (4 Formulários Progressivos)

## Visão Geral
Sistema de acompanhamento com 4 formulários que desbloqueiam progressivamente:
- **Formulário 1**: Desbloqueado imediatamente (data de criação do usuário)
- **Formulário 2**: Desbloqueia 2 dias após o primeiro ser preenchido
- **Formulário 3**: Desbloqueia 2 dias após o segundo ser preenchido
- **Formulário 4**: Desbloqueia 2 dias após o terceiro ser preenchido

## Passos para Implementação

### 1. Executar Script SQL
Execute o arquivo `SUPABASE_ACOMPANHAMENTO_NOVO.sql` no SQL Editor do Supabase.

Este script irá:
- Adicionar colunas `formulario_numero`, `data_preenchimento`, `data_desbloqueio` à tabela `acompanhamento_semanal`
- Remover constraint antiga de semana única
- Adicionar nova constraint de formulário único por usuário
- Criar função `calcular_data_desbloqueio_formulario()` para calcular datas de desbloqueio
- Criar função `formularios_disponiveis()` para verificar status dos formulários
- Criar trigger para definir data de desbloqueio automaticamente

### 2. Remover Função Antiga (Opcional)
A função `pode_responder_hoje()` não é mais necessária. Você pode removê-la se desejar:

```sql
drop function if exists public.pode_responder_hoje();
```

### 3. Verificar Funcionamento

#### No Dashboard do Usuário:
1. Acesse `/dashboard` como usuário
2. Você verá 4 caixas horizontais representando os formulários
3. O primeiro formulário estará desbloqueado e disponível
4. Clique na caixa para expandir e preencher o formulário
5. Após preencher, o formulário será marcado como "Preenchido"
6. O próximo formulário será desbloqueado 2 dias depois

#### Na Área Administrativa:
1. Acesse o perfil de um usuário em `/adminseven/user/:id`
2. Você verá a seção "Acompanhamentos" com os 4 formulários
3. Clique em cada formulário para expandir e ver os dados preenchidos
4. Formulários não preenchidos aparecerão como "Ainda não preenchido"

## Lógica de Desbloqueio

### Cálculo de Data de Desbloqueio:
```
Formulário 1: data_criacao (imediatamente)
Formulário 2: data_preenchimento_form1 + 2 dias (ou data_criacao + 2 dias se form1 não foi preenchido)
Formulário 3: data_preenchimento_form2 + 2 dias (ou data_criacao + 4 dias se anteriores não foram preenchidos)
Formulário 4: data_preenchimento_form3 + 2 dias (ou data_criacao + 6 dias se anteriores não foram preenchidos)
```

### Exemplo:
- Usuário criado em: 10/11/2025
- Acesso até: 10/12/2025 (30 dias)

**Cronograma:**
- **10/11/2025**: Formulário 1 desbloqueado
- **12/11/2025**: Formulário 2 desbloqueado (2 dias após form1 ou criação)
- **14/11/2025**: Formulário 3 desbloqueado (2 dias após form2 ou criação + 4)
- **16/11/2025**: Formulário 4 desbloqueado (2 dias após form3 ou criação + 6)

## Características do Novo Sistema

### Layout:
- **Caixas Horizontais**: Cada formulário é representado por uma caixa horizontal
- **Expansão Vertical**: Ao clicar, a caixa expande verticalmente mostrando o formulário
- **Status Visual**: 
  - 🔓 Disponível (azul) - Formulário desbloqueado e disponível para preenchimento
  - ✅ Preenchido (verde) - Formulário já foi preenchido
  - 🔒 Bloqueado (cinza) - Formulário ainda não desbloqueado
  - ⏳ Aguardando (amarelo) - Formulário desbloqueado mas aguardando ação

### Funcionalidades:
- Preenchimento de formulários disponíveis a qualquer momento (não apenas finais de semana)
- Visualização de formulários preenchidos
- Expansão/colapso de formulários para melhor organização
- Indicadores visuais de status
- Data de desbloqueio exibida para formulários bloqueados

### Área Administrativa:
- Visualização de todos os 4 formulários do usuário
- Expansão para ver detalhes de cada formulário preenchido
- Indicador visual de quais formulários foram preenchidos
- Data de preenchimento exibida

## Estrutura do Banco de Dados

### Tabela: `acompanhamento_semanal`
- `formulario_numero` (integer): Número do formulário (1-4)
- `data_preenchimento` (timestamptz): Data e hora do preenchimento
- `data_desbloqueio` (date): Data em que o formulário foi/será desbloqueado
- Constraint: `unique(user_id, formulario_numero)` - 1 formulário por número por usuário

## Troubleshooting

### Problema: Formulários não aparecem
**Solução:**
1. Verifique se o script SQL foi executado corretamente
2. Verifique se o usuário tem `user_id` definido em `consultoria_cadastros`
3. Verifique se a função `formularios_disponiveis()` está funcionando

### Problema: Formulário 2 não desbloqueia após preencher o 1
**Solução:**
1. Verifique se o formulário 1 foi salvo corretamente no banco
2. Verifique se `data_preenchimento` foi definida
3. Verifique se a função `calcular_data_desbloqueio_formulario()` está calculando corretamente

### Problema: Data de desbloqueio está incorreta
**Solução:**
1. Verifique se `created_at` está definido em `consultoria_cadastros` ou `auth.users`
2. Verifique se a lógica de cálculo está correta na função SQL
3. Verifique se não há problemas com timezone

## Notas Importantes

1. **Compatibilidade**: Os dados antigos (sem `formulario_numero`) ainda podem existir, mas não serão exibidos no novo sistema
2. **Migração**: Se houver dados antigos, você pode migrá-los atribuindo `formulario_numero = 1` para o primeiro registro de cada usuário
3. **Data de Criação**: A data de criação é buscada primeiro de `consultoria_cadastros.created_at`, depois de `auth.users.created_at`
4. **Expiração**: Formulários não serão desbloqueados se a data de desbloqueio ultrapassar a data de expiração do acesso

## Próximos Passos

Após implementar:
1. Teste criando um novo usuário
2. Verifique se o formulário 1 está disponível imediatamente
3. Preencha o formulário 1
4. Aguarde 2 dias (ou ajuste a data no banco para testar)
5. Verifique se o formulário 2 desbloqueia
6. Repita para os formulários 3 e 4
7. Verifique a visualização na área administrativa

## Melhorias Futuras (Opcional)

- Notificações quando um formulário é desbloqueado
- Gráficos de evolução baseados nos 4 formulários
- Exportação de dados dos acompanhamentos
- Comparação entre formulários
- Alertas para usuários que não preencheram formulários disponíveis

