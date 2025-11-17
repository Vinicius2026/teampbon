# Instruções: Adicionar Datas de Entrada e Término no Menu Lateral

## 📋 Resumo das Alterações

Modificado o card de informações do usuário no menu lateral para:
- ✅ Remover campo "Objetivo"
- ✅ Adicionar campo "Data de entrada" (data real que o usuário entrou no sistema)
- ✅ Adicionar campo "Data de término" (data que o usuário vai finalizar o plano)

## 🔧 Arquivos Modificados

### 1. SQL: `SUPABASE_USER_PROFILE_DATAS.sql`
- Atualiza a view `user_profile` para incluir `data_entrada` e `data_termino`
- `data_entrada`: Prioriza `created_at` da tabela `consultoria_cadastros`, depois `auth.users.created_at`
- `data_termino`: Retorna `data_expiracao` da tabela `consultoria_cadastros`

### 2. Frontend: `src/pages/dashboard/UserDashboardLayout.tsx`
- Atualizado type `UserProfile` para incluir `data_entrada` e `data_termino`
- Removido campo "Objetivo" do card
- Adicionado campo "Data de entrada" com formatação em português (dd/mm/yyyy)
- Adicionado campo "Data de término" com formatação em português (dd/mm/yyyy)

## 📝 Passos para Implementar

### 1. Executar SQL no Supabase

Execute o arquivo `SUPABASE_USER_PROFILE_DATAS.sql` no SQL Editor do Supabase:

```sql
-- Copiar e colar todo o conteúdo do arquivo SUPABASE_USER_PROFILE_DATAS.sql
```

### 2. Verificar a View

Após executar o SQL, verifique se a view foi criada corretamente:

```sql
-- Ver estrutura da view
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profile';

-- Testar a view (substitua USER_ID pelo ID de um usuário de teste)
SELECT * FROM user_profile;
```

### 3. Verificar Dados

Certifique-se de que os usuários têm `created_at` e `data_expiracao` preenchidos:

```sql
-- Verificar usuários com dados completos
SELECT 
  id,
  user_id,
  nome_completo,
  created_at,
  data_expiracao,
  dias_acesso,
  dias_adicionais
FROM consultoria_cadastros
WHERE user_id IS NOT NULL
ORDER BY created_at DESC;
```

## 🎨 Layout do Card

O card agora exibe:
- **Nome:** Nome completo do usuário
- **Plano:** Plano contratado (em vermelho e negrito)
- **Data de entrada:** Data em que o usuário entrou no sistema (formato: dd/mm/yyyy)
- **Data de término:** Data em que o plano expira (formato: dd/mm/yyyy)

## 🔍 Verificação de Funcionamento

### Verificar no Banco de Dados

```sql
-- Ver dados de um usuário específico
SELECT 
  u.id,
  u.email,
  c.nome_completo,
  c.created_at as data_entrada,
  c.data_expiracao as data_termino,
  c.plano_contratado
FROM auth.users u
LEFT JOIN consultoria_cadastros c ON c.user_id = u.id
WHERE u.id = 'USER_ID_AQUI';
```

### Verificar no Frontend

1. **Acesse o dashboard do usuário:**
   - Faça login como usuário
   - Acesse `/dashboard`
   - Verifique o menu lateral

2. **Verifique os campos:**
   - Nome deve aparecer corretamente
   - Plano deve aparecer em vermelho e negrito
   - Data de entrada deve aparecer no formato brasileiro (dd/mm/yyyy)
   - Data de término deve aparecer no formato brasileiro (dd/mm/yyyy)
   - Campo "Objetivo" não deve aparecer

## 🐛 Troubleshooting

### Datas não aparecem
- Verifique se a view foi atualizada corretamente
- Verifique se o usuário tem `created_at` e `data_expiracao` preenchidos
- Verifique o console do navegador para erros

### Data de entrada incorreta
- A data de entrada prioriza `consultoria_cadastros.created_at`
- Se não existir, usa `auth.users.created_at`
- Verifique qual tabela tem a data correta

### Data de término não aparece
- Verifique se `data_expiracao` está preenchida na tabela `consultoria_cadastros`
- A `data_expiracao` é calculada automaticamente como: `created_at + dias_acesso + dias_adicionais`
- Se não estiver preenchida, execute o script `CORRIGIR_DATA_EXPIRACAO.sql`

## 📊 Estrutura de Dados

### View `user_profile`
```sql
data_entrada DATE  -- created_at da consultoria_cadastros ou auth.users
data_termino DATE  -- data_expiracao da consultoria_cadastros
```

### Tabela `consultoria_cadastros`
```sql
created_at TIMESTAMPTZ    -- Data de criação do cadastro
data_expiracao DATE       -- Data de expiração do plano
dias_acesso INTEGER       -- Dias de acesso inicial
dias_adicionais INTEGER   -- Dias adicionais adicionados pelo admin
```

## 🎯 Próximos Passos (Opcional)

1. Adicionar indicador visual quando a data de término está próxima (ex: 7 dias)
2. Adicionar contador de dias restantes
3. Adicionar notificação quando o plano está prestes a expirar
4. Adicionar histórico de renovações/extensões do plano

