# 🆘 Sistema de Suporte - Instruções de Implementação

## 📋 Visão Geral

Sistema completo de suporte que permite usuários enviarem mensagens e administradores responderem, com notificações de mensagens não lidas.

## 🗄️ Banco de Dados

### 1. Execute o SQL no Supabase

Execute o arquivo `SUPABASE_SUPORTE.sql` no Supabase SQL Editor. Este script cria:

- **Tabela `suporte`**: Armazena mensagens de usuários e respostas de administradores
- **Políticas RLS**: Controla acesso aos dados
- **Funções auxiliares**:
  - `contar_mensagens_suporte_nao_lidas`: Conta mensagens não lidas do admin
  - `tem_solicitacao_suporte`: Verifica se usuário tem solicitações
  - `buscar_suporte_usuario`: Busca mensagens do usuário
  - `marcar_resposta_suporte_lida`: Marca resposta como lida

### 2. Verificar Dependências

Certifique-se de que a função `is_admin_user()` existe (criada em `SOLUCAO_COMPLETA_ORIENTACOES.sql`). Se não existir, execute primeiro o script de orientações expert.

## 🎨 Frontend - Painel do Usuário

### 1. Página de Suporte

A página `/dashboard/suporte` foi criada em `src/pages/dashboard/Suporte.tsx` com:

- ✅ Formulário para enviar mensagens
- ✅ Histórico de mensagens enviadas
- ✅ Visualização de respostas do admin
- ✅ Indicador de mensagens não lidas
- ✅ Botão para marcar resposta como lida

### 2. Menu Lateral

O menu lateral foi atualizado em `src/pages/dashboard/UserDashboardLayout.tsx` com:

- ✅ Item "SUPORTE" no menu
- ✅ Contador de mensagens não lidas (ex: "01", "02")
- ✅ Atualização automática a cada 30 segundos

### 3. Rotas

A rota `/dashboard/suporte` foi adicionada em `src/App.tsx`.

## 👨‍💼 Frontend - Painel Administrativo

### 1. Lista de Usuários

A lista de usuários em `src/pages/adminseven/Dashboard.tsx` foi atualizada com:

- ✅ Etiqueta "🆘 Suporte" em azul para usuários com solicitações
- ✅ Função `verificarSuporte` para identificar usuários com suporte

### 2. Perfil do Usuário

O perfil do usuário em `src/pages/adminseven/UserDetail.tsx` foi atualizado com:

- ✅ Seção "🆘 Suporte" abaixo de "Orientações Expert"
- ✅ Lista de mensagens do usuário
- ✅ Campo para responder cada mensagem
- ✅ Indicador de mensagens sem resposta
- ✅ Status de leitura das respostas

## 🔄 Fluxo de Funcionamento

### 1. Usuário Envia Mensagem

1. Usuário acessa `/dashboard/suporte`
2. Digita mensagem e clica em "Enviar Mensagem"
3. Mensagem é salva na tabela `suporte`
4. Mensagem aparece no histórico do usuário

### 2. Admin Visualiza e Responde

1. Admin vê etiqueta "🆘 Suporte" na lista de usuários
2. Admin acessa perfil do usuário
3. Admin expande seção "Suporte"
4. Admin vê mensagens do usuário
5. Admin expande mensagem e digita resposta
6. Admin clica em "Enviar Resposta"
7. Resposta é salva e `lido_pelo_usuario` é definido como `false`

### 3. Usuário Recebe Notificação

1. Contador no menu lateral atualiza automaticamente
2. Usuário vê número de mensagens não lidas (ex: "01")
3. Usuário acessa `/dashboard/suporte`
4. Usuário vê resposta com badge "Nova Resposta"
5. Usuário expande mensagem e lê resposta
6. Usuário clica em "Marcar como lida"
7. Contador é atualizado

## 🧪 Como Testar

### 1. Teste como Usuário

1. Faça login como usuário
2. Acesse `/dashboard/suporte`
3. Envie uma mensagem de teste
4. Verifique se aparece no histórico
5. Aguarde resposta do admin (ou teste como admin)

### 2. Teste como Admin

1. Faça login como admin
2. Acesse lista de usuários
3. Verifique se aparece etiqueta "🆘 Suporte" no usuário que enviou mensagem
4. Acesse perfil do usuário
5. Expanda seção "Suporte"
6. Veja mensagem do usuário
7. Digite resposta e envie
8. Verifique se resposta foi salva

### 3. Teste de Notificação

1. Como usuário, verifique contador no menu lateral
2. Aguarde resposta do admin (ou responda como admin)
3. Verifique se contador atualiza (pode levar até 30 segundos)
4. Acesse página de suporte
5. Veja resposta com badge "Nova Resposta"
6. Marque como lida
7. Verifique se contador desaparece

## 📝 Notas Técnicas

- **Contador de mensagens não lidas**: Atualiza automaticamente a cada 30 segundos
- **Políticas RLS**: Garantem que usuários só veem suas próprias mensagens
- **Status de leitura**: Controlado pelo campo `lido_pelo_usuario`
- **Múltiplas mensagens**: Usuário pode enviar múltiplas mensagens
- **Histórico**: Ordenado por data (mais recente primeiro)

## ✅ Checklist de Implementação

- [x] Criar tabela `suporte` no Supabase
- [x] Criar políticas RLS
- [x] Criar funções auxiliares SQL
- [x] Criar página de suporte para usuário
- [x] Adicionar item "SUPORTE" no menu lateral
- [x] Adicionar contador de mensagens não lidas
- [x] Adicionar etiqueta "Suporte" na lista de usuários
- [x] Adicionar seção de suporte no perfil do usuário
- [x] Implementar funcionalidade de resposta do admin
- [x] Implementar marcação de leitura
- [x] Adicionar rotas
- [x] Testar fluxo completo

## 🐛 Troubleshooting

### Contador não atualiza

- Verifique se a função `contar_mensagens_suporte_nao_lidas` existe
- Verifique se RLS permite acesso à função
- Verifique console do navegador para erros

### Admin não vê mensagens

- Verifique se função `is_admin_user()` existe
- Verifique se políticas RLS estão corretas
- Verifique se usuário tem role `admin` no `app_metadata`

### Mensagens não aparecem

- Verifique se mensagem foi salva no banco
- Verifique se `user_id` está correto
- Verifique políticas RLS

### Resposta não é enviada

- Verifique se admin tem permissão para atualizar
- Verifique se campo `resposta_admin` está sendo atualizado
- Verifique console do navegador para erros

## 📚 Arquivos Modificados/Criados

- ✅ `SUPABASE_SUPORTE.sql` - Estrutura do banco de dados
- ✅ `src/pages/dashboard/Suporte.tsx` - Página de suporte do usuário
- ✅ `src/pages/dashboard/UserDashboardLayout.tsx` - Menu lateral com contador
- ✅ `src/pages/adminseven/Dashboard.tsx` - Lista de usuários com etiqueta
- ✅ `src/pages/adminseven/UserDetail.tsx` - Seção de suporte no perfil
- ✅ `src/App.tsx` - Rotas atualizadas

