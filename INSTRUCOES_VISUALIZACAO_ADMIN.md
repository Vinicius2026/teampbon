# Instruções: Sistema de Visualização de Acompanhamentos pelo Admin

## 📋 Resumo das Alterações

Implementado sistema completo para que o administrador possa visualizar e confirmar análise dos formulários de acompanhamento preenchidos pelos usuários.

## ✅ Funcionalidades Implementadas

### 1. Etiqueta "Confirmado" no Dashboard do Usuário
- Quando um formulário é preenchido, a etiqueta muda de "Disponível" para "✅ Confirmado"
- Formulários preenchidos não podem ser editados novamente
- Mensagem clara informando que o formulário foi confirmado

### 2. Etiqueta "Progresso (Visualize)" na Lista de Usuários
- Aparece na lista de usuários aprovados quando há acompanhamentos não visualizados
- Aparece na lista de usuários pendentes quando há acompanhamentos não visualizados
- Etiqueta amarela com animação pulsante para chamar atenção
- Desaparece automaticamente quando o admin confirma a análise

### 3. Botão "Confirmar Análise" no UserDetail
- Botão aparece quando um acompanhamento está expandido e não foi visualizado
- Ao clicar, marca o acompanhamento como visualizado
- Mostra status de confirmação após ser clicado
- Atualiza a lista de usuários automaticamente

### 4. Coluna `admin_visualizado` no Banco de Dados
- Nova coluna `admin_visualizado` (boolean) na tabela `acompanhamento_semanal`
- Nova coluna `admin_visualizado_em` (timestamptz) para rastrear quando foi visualizado
- Índice para performance
- Policy para permitir que admin atualize essas colunas

## 🔧 Arquivos Modificados

### 1. SQL: `SUPABASE_ADMIN_VISUALIZACAO.sql`
- Adiciona colunas `admin_visualizado` e `admin_visualizado_em`
- Cria função `tem_acompanhamentos_nao_visualizados()`
- Cria view `usuarios_com_progresso_pendente`
- Cria policy para admin atualizar visualização

### 2. Frontend: `src/pages/dashboard/Home.tsx`
- Mudança de etiqueta "Preenchido" para "✅ Confirmado"
- Mensagem informando que formulário confirmado não pode ser alterado
- Garantia de que formulários preenchidos não podem ser editados

### 3. Frontend: `src/pages/adminseven/Dashboard.tsx`
- Adiciona campo `tem_progresso_pendente` ao type `Row`
- Função `verificarProgressoPendente()` para verificar quais usuários têm acompanhamentos não visualizados
- Exibe etiqueta "📊 Progresso (Visualize)" na lista de usuários
- Recarrega lista quando página recebe foco (volta do UserDetail)

### 4. Frontend: `src/pages/adminseven/UserDetail.tsx`
- Adiciona função `confirmarAnalise()` no componente `AcompanhamentosSection`
- Botão "✅ Confirmar Análise" quando acompanhamento não foi visualizado
- Status visual mostrando se análise foi confirmada ou está aguardando
- Atualização automática após confirmação

## 📝 Passos para Implementar

### 1. Executar SQL no Supabase

Execute o arquivo `SUPABASE_ADMIN_VISUALIZACAO.sql` no SQL Editor do Supabase:

```sql
-- Copiar e colar todo o conteúdo do arquivo SUPABASE_ADMIN_VISUALIZACAO.sql
```

### 2. Verificar Permissões

Certifique-se de que o usuário admin tem permissão para atualizar a tabela `acompanhamento_semanal`:

```sql
-- Verificar se a policy foi criada
SELECT * FROM pg_policies WHERE tablename = 'acompanhamento_semanal';
```

### 3. Testar Funcionalidade

1. **Como Usuário:**
   - Preencha um formulário de acompanhamento
   - Verifique que a etiqueta mostra "✅ Confirmado"
   - Tente editar novamente (não deve ser possível)

2. **Como Admin:**
   - Acesse a lista de usuários
   - Verifique se aparece a etiqueta "📊 Progresso (Visualize)" nos usuários com acompanhamentos não visualizados
   - Clique em "Ver" para abrir o perfil do usuário
   - Expanda um acompanhamento
   - Clique em "✅ Confirmar Análise"
   - Volte para a lista e verifique que a etiqueta desapareceu

## 🔍 Verificação de Funcionamento

### Verificar no Banco de Dados

```sql
-- Ver acompanhamentos não visualizados
SELECT 
  a.*,
  c.nome_completo,
  c.email
FROM acompanhamento_semanal a
JOIN consultoria_cadastros c ON c.user_id = a.user_id
WHERE a.admin_visualizado = false
  AND a.formulario_numero IS NOT NULL;

-- Ver usuários com progresso pendente
SELECT * FROM usuarios_com_progresso_pendente;
```

### Verificar no Frontend

1. **Dashboard do Usuário:**
   - Formulário preenchido deve mostrar "✅ Confirmado"
   - Não deve permitir edição

2. **Dashboard do Admin:**
   - Usuários com acompanhamentos não visualizados devem mostrar etiqueta amarela
   - Etiqueta deve desaparecer após confirmação

3. **UserDetail do Admin:**
   - Botão "Confirmar Análise" deve aparecer quando acompanhamento não foi visualizado
   - Status deve mudar para "✅ Análise confirmada" após clicar
   - Data de confirmação deve ser exibida

## 🐛 Troubleshooting

### Etiqueta não aparece na lista
- Verifique se o SQL foi executado corretamente
- Verifique se há acompanhamentos com `admin_visualizado = false`
- Verifique se `formulario_numero` não é null

### Botão não funciona
- Verifique se a policy de update está criada
- Verifique se o usuário tem permissão de admin
- Verifique o console do navegador para erros

### Lista não atualiza após confirmação
- A lista é atualizada quando a página recebe foco
- Recarregue a página manualmente se necessário
- Verifique se o evento `visibilitychange` está funcionando

## 📊 Estrutura de Dados

### Tabela `acompanhamento_semanal`
```sql
admin_visualizado BOOLEAN DEFAULT FALSE
admin_visualizado_em TIMESTAMPTZ
```

### View `usuarios_com_progresso_pendente`
- Retorna usuários que têm pelo menos um acompanhamento não visualizado
- Inclui contagem de acompanhamentos não visualizados

## 🎯 Próximos Passos (Opcional)

1. Adicionar notificações quando novo acompanhamento é preenchido
2. Adicionar filtro na lista para mostrar apenas usuários com progresso pendente
3. Adicionar estatísticas de acompanhamentos visualizados/não visualizados
4. Adicionar comentários do admin nos acompanhamentos

