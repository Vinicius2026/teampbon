# 🚀 Guia de Deploy - Hostinger

## ✅ Build Completo e Testado

O build está funcionando perfeitamente! Todos os arquivos foram otimizados.

## 📦 Passos para Deploy na Hostinger

### 1. **Faça o Build**
```bash
npm run build
```

### 2. **Pasta para Upload**
Todos os arquivos dentro da pasta `dist/` devem ser enviados para a Hostinger.

### 3. **Upload na Hostinger**
1. Acesse o **File Manager** no painel da Hostinger
2. Vá para a pasta `public_html` (ou `public` dependendo do seu plano)
3. **Delete todos os arquivos antigos** (se houver)
4. **Faça upload de TODOS os arquivos** da pasta `dist/`:
   - `index.html`
   - `.htaccess` ⭐ (IMPORTANTE para SPA routing!)
   - Pasta `assets/` (completa)
   - Todos os arquivos `.png`, `.ico`, etc.

### 4. **Estrutura Final no Servidor**
```
public_html/
├── index.html
├── .htaccess          ⭐ Essencial para React Router funcionar!
├── assets/
│   ├── index-*.css
│   ├── index-*.js
│   └── *.png (logos)
├── og-image.png
├── favicon.ico
└── ... (outros arquivos)
```

## ⚠️ Problemas Comuns e Soluções

### ❌ **404 em rotas (ex: /pg2)**
**Solução**: Certifique-se que o arquivo `.htaccess` está na raiz do `public_html` e está ativo.

### ❌ **Imagens não carregam**
**Solução**: Verifique se a pasta `assets/` foi enviada completa e que os caminhos no HTML estão como `./assets/...`

### ❌ **Página em branco**
**Possíveis causas**:
1. JavaScript não carregando
2. Caminhos absolutos incorretos
3. `.htaccess` não configurado

**Solução**: 
- Abra o DevTools (F12) → Console
- Verifique erros de 404
- Confirme que todos os arquivos em `assets/` estão no servidor

### ❌ **Build com erro**
Se o `npm run build` falhar, verifique:
- Node.js versão 18+ instalada
- `npm install` executado
- Sem erros de TypeScript

## 🔧 Configurações Aplicadas

### ✅ `.htaccess` Criado
- SPA routing (React Router)
- Cache de assets
- Compressão Gzip
- Headers de segurança

### ✅ Vite Config Otimizado
- Base path relativo (`./`)
- Minificação com esbuild
- Assets organizados

### ✅ Meta Tags
- Open Graph configurado
- Twitter Cards
- Thumbnail: `/og-image.png`

## 📱 Teste Após Deploy

1. Acesse seu domínio
2. Teste todas as rotas: `/`, `/pg2`, `/pg3`, etc.
3. Teste no mobile (Instagram in-app)
4. Verifique console do navegador (F12)

## 🎯 Checklist Final

- [ ] Build executado com sucesso
- [ ] Todos os arquivos de `dist/` enviados
- [ ] `.htaccess` na raiz do `public_html`
- [ ] Pasta `assets/` completa no servidor
- [ ] Rotas funcionando (sem 404)
- [ ] Mobile testado
- [ ] WhatsApp link funcionando

---

**Pronto!** Seu site está otimizado para a Hostinger! 🎉

