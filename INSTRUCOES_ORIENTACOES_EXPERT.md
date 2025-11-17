# Sistema de Orientações Expert

## 📋 Visão Geral

Sistema de mensagens/orientações do administrador para os usuários. O administrador pode enviar mensagens personalizadas que aparecem na área "Orientações Expert" do dashboard do usuário.

## 🗄️ Banco de Dados

### Tabela: `orientacoes_expert`

Execute o arquivo `SUPABASE_ORIENTACOES_EXPERT.sql` no Supabase SQL Editor para criar:
- Tabela `orientacoes_expert`
- Políticas RLS (Row Level Security)
- Funções RPC para buscar e marcar mensagens
- Índices para performance

### Colunas da Tabela:
- `id` (uuid): ID único da mensagem
- `user_id` (uuid): ID do usuário que recebe a mensagem
- `user_email` (text): Email do usuário
- `mensagem` (text): Conteúdo da mensagem
- `enviado_por` (uuid): ID do administrador que enviou
- `enviado_por_email` (text): Email do administrador
- `enviado_em` (timestamptz): Data/hora de envio
- `lido` (boolean): Se a mensagem foi lida
- `lido_em` (timestamptz): Data/hora de leitura
- `created_at` (timestamptz): Data de criação
- `updated_at` (timestamptz): Data de atualização

### Funções RPC:
1. `buscar_mensagens_usuario(p_user_id uuid)`: Busca todas as mensagens de um usuário
2. `marcar_mensagem_lida(p_mensagem_id uuid, p_user_id uuid)`: Marca uma mensagem como lida
3. `contar_mensagens_nao_lidas(p_user_id uuid)`: Conta mensagens não lidas (opcional)

## 🎨 Interface do Usuário

### Home do Usuário (`src/pages/dashboard/Home.tsx`)

**Funcionalidades:**
- Área expansível "Orientações Expert" abaixo dos formulários
- Etiqueta "Nova Mensagem" quando há mensagens não lidas
- Lista de mensagens ordenadas por data (mais recentes no topo)
- Botão "Confirmar leitura" para cada mensagem não lida
- Botão fica cinza após confirmação
- Atualização automática a cada 30 segundos
- Histórico de todas as mensagens (lidas e não lidas)

**Comportamento:**
- Mensagens não lidas aparecem destacadas (borda roxa)
- Mensagens lidas aparecem com borda cinza
- Etiqueta "Nova Mensagem" desaparece quando todas são lidas
- Mensagens antigas ficam disponíveis para releitura

## 🔧 Interface do Administrador

### UserDetail (`src/pages/adminseven/UserDetail.tsx`)

**Funcionalidades:**
- Seção "Orientações Expert" expansível
- Formulário para enviar nova mensagem
- Lista de todas as mensagens enviadas para o usuário
- Indicador de mensagens não lidas
- Status de leitura (Lido/Não lido)
- Data/hora de envio e leitura
- Visualização expandida de cada mensagem

**Comportamento:**
- Administrador pode enviar múltiplas mensagens
- Mensagens são salvas e registradas
- Status de leitura é atualizado em tempo real
- Histórico completo de mensagens é mantido

## 🚀 Como Usar

### 1. Configuração do Banco de Dados

1. Execute o arquivo `SUPABASE_ORIENTACOES_EXPERT.sql` no Supabase SQL Editor
2. Verifique se as políticas RLS foram criadas corretamente
3. Teste as funções RPC

### 2. Enviar Mensagem (Administrador)

1. Acesse a área administrativa
2. Abra o perfil do usuário
3. Expanda a seção "Orientações Expert"
4. Digite a mensagem no campo de texto
5. Clique em "Enviar Mensagem"

### 3. Visualizar Mensagens (Usuário)

1. Acesse o dashboard do usuário
2. Role para baixo até a área "Orientações Expert"
3. Expanda a área para ver as mensagens
4. Clique em "Confirmar leitura" após ler uma mensagem

## 📊 Funcionalidades Implementadas

✅ Tabela de mensagens no banco de dados
✅ Políticas RLS para segurança
✅ Funções RPC para buscar e marcar mensagens
✅ Interface do usuário com área expansível
✅ Etiqueta "Nova Mensagem" para mensagens não lidas
✅ Botão de confirmação de leitura
✅ Histórico de mensagens
✅ Interface do administrador para enviar mensagens
✅ Visualização de status de leitura
✅ Atualização automática de mensagens

## 🔒 Segurança

- Usuários só podem ver suas próprias mensagens
- Usuários só podem marcar suas próprias mensagens como lidas
- Apenas administradores podem enviar mensagens
- Apenas administradores podem ver todas as mensagens
- Políticas RLS garantem isolamento de dados

## 🎯 Próximos Passos (Opcional)

- [ ] Notificações push quando nova mensagem é enviada
- [ ] Filtros de mensagens (lidas/não lidas)
- [ ] Busca de mensagens
- [ ] Anexos em mensagens
- [ ] Respostas do usuário ao administrador
- [ ] Categorias de mensagens

## 🐛 Troubleshooting

### Mensagens não aparecem para o usuário
- Verifique se a função RPC `buscar_mensagens_usuario` está funcionando
- Verifique as políticas RLS
- Verifique se o `user_id` está correto

### Botão de confirmação não funciona
- Verifique se a função RPC `marcar_mensagem_lida` está funcionando
- Verifique as políticas RLS de update
- Verifique o console do navegador para erros

### Administrador não consegue enviar mensagem
- Verifique se o usuário tem role de admin
- Verifique as políticas RLS de insert
- Verifique se o `user_id` do destinatário está correto

## 📝 Notas

- Mensagens são ordenadas por data de envio (mais recentes primeiro)
- Mensagens não lidas têm destaque visual
- Histórico completo é mantido para referência
- Atualização automática verifica novas mensagens a cada 30 segundos

