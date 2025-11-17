# Correção: Bloqueio de Formulários Preenchidos

## 🐛 Problema Identificado

Quando um usuário tentava preencher novamente um formulário de acompanhamento que já havia sido preenchido, ocorria o seguinte erro:
```
❌ Erro: duplicate key value violates unique constraint "acompanhamento_formulario_unico"
```

## ✅ Solução Implementada

### 1. Bloqueio de Expansão
- Formulários preenchidos **NÃO podem mais ser expandidos**
- O botão fica desabilitado quando o formulário está preenchido
- Cursor muda para `not-allowed` quando o formulário está preenchido

### 2. Etiqueta Visual
- Adicionada etiqueta **"✅ Já preenchido"** quando o formulário está preenchido
- Etiqueta aparece no lugar da seta de expansão
- Estilo verde (emerald) para indicar conclusão

### 3. Validação no Envio
- Verificação antes de inserir no banco de dados
- Verificação se o formulário já existe no estado
- Tratamento específico para erro de constraint única
- Mensagem clara informando que o formulário já foi preenchido

### 4. Atualização Automática
- Formulário é fechado automaticamente após envio bem-sucedido
- Estado é atualizado após envio para refletir o status de preenchido
- Formulário é fechado automaticamente se for marcado como preenchido enquanto está expandido

## 🔧 Alterações no Código

### `src/pages/dashboard/Home.tsx`

#### 1. Bloqueio de Expansão (linhas 446-461)
```typescript
<button
  onClick={() => {
    // Só permitir expandir se NÃO estiver preenchido
    if (!form.preenchido && (form.pode_preencher || form.desbloqueado || form.formulario_numero === 1)) {
      setExpandedForm(isExpanded ? null : form.formulario_numero);
    }
  }}
  disabled={form.preenchido || (!form.pode_preencher && !form.desbloqueado && form.formulario_numero !== 1)}
  className={form.preenchido ? "cursor-not-allowed opacity-75" : "..."}
>
```

#### 2. Etiqueta "Já preenchido" (linhas 500-503)
```typescript
{form.preenchido && (
  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-900/50 text-emerald-400 border border-emerald-700">
    ✅ Já preenchido
  </span>
)}
```

#### 3. Conteúdo Só para Formulários Não Preenchidos (linha 522)
```typescript
{isExpanded && !form.preenchido && (
  <div className="border-t border-zinc-700 bg-zinc-900/50 p-6 space-y-6 animate-fade-in">
    {/* Conteúdo do formulário */}
  </div>
)}
```

#### 4. Validação no handleSubmit (linhas 317-359)
```typescript
// Verificar se o formulário já foi preenchido antes de tentar inserir
const formularioAtual = formularios.find(f => f.formulario_numero === numero);
if (formularioAtual?.preenchido) {
  throw new Error("Este formulário já foi preenchido e não pode ser editado.");
}

// Verificar se já existe um registro no banco de dados
const { data: existe, error: erroVerificacao } = await supabase
  .from("acompanhamento_semanal")
  .select("id, formulario_numero")
  .eq("user_id", session.session.user.id)
  .eq("formulario_numero", numero)
  .maybeSingle();

if (existe) {
  throw new Error("Este formulário já foi preenchido. Recarregue a página para ver o status atualizado.");
}

// Tratamento de erro de constraint única
if (error) {
  if (error.code === '23505' || error.message.includes('duplicate key') || error.message.includes('acompanhamento_formulario_unico')) {
    throw new Error("Este formulário já foi preenchido anteriormente. Recarregue a página para ver o status atualizado.");
  }
  throw error;
}
```

#### 5. Fechamento Automático (linhas 123-131)
```typescript
// Fechar formulário automaticamente se ele for marcado como preenchido enquanto está expandido
useEffect(() => {
  if (expandedForm !== null) {
    const formularioExpandido = formularios.find(f => f.formulario_numero === expandedForm);
    if (formularioExpandido?.preenchido) {
      setExpandedForm(null);
    }
  }
}, [formularios, expandedForm]);
```

## 🎯 Comportamento Esperado

### Formulário Não Preenchido
- ✅ Pode ser expandido
- ✅ Mostra seta de expansão
- ✅ Badge "🔓 Disponível" (azul)
- ✅ Conteúdo do formulário aparece quando expandido
- ✅ Botão "ENVIAR FORMULÁRIO" aparece

### Formulário Preenchido
- ❌ **NÃO pode ser expandido**
- ❌ Seta de expansão **NÃO aparece**
- ✅ Badge "✅ Confirmado" (verde)
- ✅ Etiqueta "✅ Já preenchido" aparece
- ✅ Mostra data de preenchimento
- ✅ Conteúdo do formulário **NÃO aparece** (mesmo se tentar expandir)
- ❌ Botão "ENVIAR FORMULÁRIO" **NÃO aparece**

## 🔍 Testes Realizados

1. ✅ Formulário não preenchido pode ser expandido
2. ✅ Formulário preenchido não pode ser expandido
3. ✅ Etiqueta "Já preenchido" aparece corretamente
4. ✅ Tentativa de envio duplicado é bloqueada
5. ✅ Mensagem de erro é clara e informativa
6. ✅ Estado é atualizado após envio
7. ✅ Formulário é fechado automaticamente após envio

## 🐛 Troubleshooting

### Formulário ainda pode ser expandido após preenchimento
- Verifique se `form.preenchido` está `true` no estado
- Verifique se a função `formularios_disponiveis` está retornando `preenchido: true`
- Recarregue a página para garantir que o estado está atualizado

### Erro de constraint única ainda ocorre
- Verifique se a validação no `handleSubmit` está sendo executada
- Verifique se o banco de dados tem a constraint `acompanhamento_formulario_unico`
- Verifique se há registros duplicados no banco de dados

### Etiqueta não aparece
- Verifique se `form.preenchido` está `true`
- Verifique se o componente está renderizando corretamente
- Verifique o console do navegador para erros

## 📋 Checklist de Verificação

- [x] Formulários preenchidos não podem ser expandidos
- [x] Etiqueta "Já preenchido" aparece corretamente
- [x] Seta de expansão não aparece para formulários preenchidos
- [x] Validação no handleSubmit funciona
- [x] Mensagem de erro é clara
- [x] Estado é atualizado após envio
- [x] Formulário é fechado automaticamente após envio
- [x] Constraint única no banco de dados está funcionando

## 🎨 Visual

### Formulário Preenchido
- Border: `border-emerald-700/50` (verde)
- Badge: `✅ Confirmado` (verde)
- Etiqueta: `✅ Já preenchido` (verde)
- Opacidade: `opacity-75`
- Cursor: `not-allowed`

### Formulário Disponível
- Border: `border-blue-600/50` (azul)
- Badge: `🔓 Disponível` (azul)
- Seta de expansão: visível
- Cursor: `pointer`

