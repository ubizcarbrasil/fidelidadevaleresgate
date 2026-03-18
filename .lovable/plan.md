

## Plano: Corrigir rotas bloqueadas no painel do empreendedor

### Problema identificado

Quatro páginas estão inacessíveis para o empreendedor, apesar de os módulos estarem habilitados no `brand_modules`. As causas são duas:

| Página | Rota | Problema |
|---|---|---|
| Achadinhos | `/affiliate-deals` | `ModuleGuard` usa `moduleKey="achadinhos"` mas a chave real no banco é `affiliate_deals` |
| Categorias de Achadinhos | `/affiliate-categories` | Mesmo problema: `moduleKey="achadinhos"` vs `affiliate_deals` |
| Import Mobile Achadinhos | `/affiliate-deals/import-mobile` | Mesmo problema |
| Taxonomia | `/taxonomy` | Rota protegida com `RootGuard` em vez de `ModuleGuard` — bloqueia empreendedor |
| Links do Perfil | `/profile-links` | Rota protegida com `RootGuard` em vez de `ModuleGuard` |

O sidebar do empreendedor (`BrandSidebar.tsx`) já usa as chaves corretas (`affiliate_deals`, `taxonomy`, `profile_links`), então os itens de menu aparecem — mas ao clicar, a rota redireciona para `/` por causa do guard errado.

### Solução

**Arquivo:** `src/App.tsx`

1. **Achadinhos** (3 rotas): Trocar `moduleKey="achadinhos"` por `moduleKey="affiliate_deals"`
2. **Taxonomia**: Trocar `RootGuard` por `ModuleGuard moduleKey="taxonomy"`
3. **Links do Perfil**: Trocar `RootGuard` por `ModuleGuard moduleKey="profile_links"`

São 5 linhas alteradas, sem impacto em nenhuma outra funcionalidade. O ROOT continua acessando tudo porque `useBrandModules` retorna `true` para ROOT em todos os módulos.

