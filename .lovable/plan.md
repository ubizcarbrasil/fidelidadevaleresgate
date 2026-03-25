

## Diagnóstico: spinner infinito no carregamento

### Causa raiz

O `AppContent` (linha 292 do `App.tsx`) bloqueia **todas as rotas** — inclusive `/auth` — enquanto `BrandContext.loading` for `true`:

```typescript
// App.tsx:292
if (loading) {
  return <div>...spinner...</div>; // ← TUDO fica preso aqui
}
```

O `BrandContext.resolve()` (linha 84) não tem `try/catch`. Se a chamada ao Supabase falhar ou demorar, `setLoading(false)` nunca é chamado e o app fica no spinner para sempre.

Além disso, diferente do `AuthContext` que tem timeout de 8 segundos, o `BrandContext` não tem nenhum mecanismo de segurança.

### Correções

#### 1. Adicionar try/catch + timeout no BrandContext
**Arquivo:** `src/contexts/BrandContext.tsx`

- Envolver `resolve()` em try/catch, garantindo que `setLoading(false)` seja chamado mesmo em caso de erro
- Adicionar timeout de segurança de 5 segundos (similar ao AuthContext)

#### 2. Não bloquear /auth atrás do BrandContext loading
**Arquivo:** `src/App.tsx`

Na função `AppContent`, verificar o pathname antes do gate de loading. Se a rota for `/auth`, `/reset-password`, `/trial`, `/landing` ou `/register-store` (rotas públicas), renderizar direto sem esperar BrandContext.

Mudança em `AppContent`:
```typescript
// Rotas públicas que não dependem de brand
const publicPaths = ["/auth", "/reset-password", "/trial", "/landing"];
const isPublicPath = publicPaths.some(p => location.pathname.startsWith(p));

if (loading && !isPublicPath && !isPartnerLanding && !isDriverPanel) {
  return <div>...spinner...</div>;
}
```

### Resultado
- BrandContext nunca fica preso em loading infinito
- A página de login renderiza imediatamente, sem esperar resolução de brand
- Rotas públicas ficam acessíveis mesmo com Supabase lento

### Arquivos alterados
- `src/contexts/BrandContext.tsx`
- `src/App.tsx`

