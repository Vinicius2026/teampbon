# Instruções para Executar o SQL Corrigido

## ⚠️ Problema Identificado

O arquivo original `SUPABASE_ACOMPANHAMENTO_NOVO.sql` tinha blocos `declare` aninhados dentro de loops, o que causa erro de sintaxe no PostgreSQL.

## ✅ Solução

Use o arquivo **`SUPABASE_ACOMPANHAMENTO_NOVO_CORRIGIDO.sql`** que foi criado com a estrutura corrigida.

## 📝 Passos para Executar

### 1. Abrir SQL Editor no Supabase
1. Acesse o painel do Supabase
2. Vá para **SQL Editor** no menu lateral
3. Clique em **New Query**

### 2. Copiar o Conteúdo do Arquivo Corrigido
1. Abra o arquivo `SUPABASE_ACOMPANHAMENTO_NOVO_CORRIGIDO.sql`
2. Copie **TODO** o conteúdo do arquivo
3. Cole no SQL Editor do Supabase

### 3. Executar o Script
1. Clique no botão **Run** (ou pressione Ctrl+Enter)
2. Aguarde a execução
3. Verifique se não há erros

### 4. Verificar se Funcionou
Execute esta query para testar:

```sql
-- Testar a função (substitua USER_ID pelo ID de um usuário de teste)
select * from public.formularios_disponiveis('USER_ID_AQUI');
```

## 🔍 Principais Correções Aplicadas

1. **Removidos blocos `declare` aninhados**: Todas as variáveis são declaradas no início da função
2. **Simplificada a estrutura do loop**: Lógica mais clara e direta
3. **Corrigida a lógica de desbloqueio**: Formulário 1 sempre disponível se não estiver preenchido

## ⚙️ O que o Script Faz

1. **Adiciona colunas** à tabela `acompanhamento_semanal`:
   - `formulario_numero` (1 a 4)
   - `data_preenchimento`
   - `data_desbloqueio`

2. **Cria função `calcular_data_desbloqueio_formulario()`**:
   - Calcula quando cada formulário deve ser desbloqueado
   - Formulário 1: imediato (data de criação)
   - Formulários 2-4: 2 dias após o anterior ser preenchido

3. **Cria função `formularios_disponiveis()`**:
   - Retorna status de todos os 4 formulários
   - Indica quais estão desbloqueados e disponíveis para preenchimento

4. **Cria trigger**:
   - Define automaticamente `data_desbloqueio` ao inserir um novo formulário

## 🐛 Se Ainda Der Erro

1. **Verifique se copiou o arquivo correto**: Use `SUPABASE_ACOMPANHAMENTO_NOVO_CORRIGIDO.sql`
2. **Verifique se não há código React/TypeScript**: O SQL deve começar com comentários `--`
3. **Execute em partes**: Se necessário, execute seção por seção:
   - Primeiro: Alterações na tabela
   - Segundo: Função `calcular_data_desbloqueio_formulario`
   - Terceiro: Função `formularios_disponiveis`
   - Quarto: Trigger

## 📋 Checklist

- [ ] Arquivo `SUPABASE_ACOMPANHAMENTO_NOVO_CORRIGIDO.sql` está no projeto
- [ ] Conteúdo foi copiado completamente
- [ ] Script foi executado sem erros
- [ ] Função `formularios_disponiveis` foi criada
- [ ] Teste com um user_id retornou resultados

## 🆘 Suporte

Se ainda houver problemas:
1. Verifique os logs de erro no Supabase
2. Execute a query de teste para ver o erro específico
3. Verifique se todas as tabelas necessárias existem (`consultoria_cadastros`, `auth.users`)

