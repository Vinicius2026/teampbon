# Configuração de Ambiente (.env) - Supabase

Crie um arquivo `.env` na raiz do projeto com:

```
VITE_SUPABASE_URL=https://znxkqhcddhfamuhjmeif.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpueGtxaGNkZGhmYW11aGptZWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MzE4NjAsImV4cCI6MjA3ODIwNzg2MH0.AZKLaSQhgQ-veD5B6zOtnXVGxXw401Ws19CK9XHoUeg
```

Importante:
- **NÃO** exponha a `service_role` no frontend. Essa chave tem permissões administrativas e deve ser usada apenas em um backend seguro.
- Após criar/alterar o `.env`, reinicie o servidor de desenvolvimento/build.

O cliente Supabase é inicializado a partir de `src/lib/supabaseClient.ts`.


