

# Roteamento Inteligente por Sessão — White-Label

## Análise do Estado Atual

O roteamento em `App.tsx` (linhas 364-383) **já implementa** a lógica principal:
- Visitante anônimo em domínio white-label → `WhiteLabelLayout`
- `brand_admin` ou `branch_admin` logado no domínio da marca → `AnimatedRoutes` (painel admin)
- `root_admin` em qualquer domínio → funciona porque `isWhiteLabel = false` no domínio da plataforma

### O que falta

1. **`store_admin` não é roteado** — brand_admin e branch_admin são verificados, mas `store_admin` fica no `WhiteLabelLayout` quando acessa o domínio da marca
2. **Root admin em domínio white-label** — se um root_admin acessar `ubizcar.com.br`, ele cai no `WhiteLabelLayout` porque não tem `brand_id` associado. Precisa de tratamento especial
3. **Badge visual** — não existe indicador de "domínio próprio" no header do painel admin

## Mudanças

### 1. `src/App.tsx` — Ampliar verificação de roles (linhas 364-376)

Adicionar `store_admin` à verificação e incluir `root_admin` como passagem direta:

```typescript
if (isWhiteLabel) {
  if (user && !authLoading) {
    const isRoot = roles.some((r) => r.role === "root_admin");
    const isBrandAdmin = brand && roles.some(
      (r) => r.role === "brand_admin" && r.brand_id === brand.id
    );
    const isBranchAdmin = brand && roles.some(
      (r) => ["branch_admin", "branch_operator", "operator_pdv"].includes(r.role) && r.brand_id === brand.id
    );
    const isStoreAdmin = brand && roles.some(
      (r) => r.role === "store_admin" && r.brand_id === brand.id
    );

    if (isRoot || isBrandAdmin || isBranchAdmin || isStoreAdmin) {
      return <AnimatedRoutes />;
    }
  }
  // ...resto mantido
}
```

### 2. `src/components/AppLayout.tsx` — Badge "Domínio Próprio"

Adicionar um indicador sutil no header quando `isWhiteLabel === true`:
- Importar `useBrand` e ler `isWhiteLabel`
- Renderizar um badge com ícone `Globe` e texto "Domínio próprio" ao lado do botão "Voltar ao Painel Raiz" (que já existe para impersonação)
- Estilo discreto: texto pequeno, cor `muted-foreground`, ícone Globe de 14px

```typescript
// No header, após o bloco isImpersonating:
{isWhiteLabel && !isImpersonating && (
  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-accent/40 px-2.5 py-1 rounded-md">
    <Globe className="h-3.5 w-3.5" />
    <span className="hidden sm:inline">Domínio próprio</span>
  </div>
)}
```

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/App.tsx` | Adicionar `root_admin` e `store_admin` ao roteamento white-label |
| `src/components/AppLayout.tsx` | Badge "Domínio próprio" no header |

Nenhuma mudança de banco de dados necessária.

