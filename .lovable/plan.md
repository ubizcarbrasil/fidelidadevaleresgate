

# Plano: Corrigir inconsistências restantes + Modernizar BranchSidebar

## 1. Rotas faltantes no RootSidebar

Rotas existentes em `App.tsx` e/ou `BrandSidebar` que não aparecem no `RootSidebar`:

| Rota | Presente em | Ação |
|------|------------|------|
| `/app-icons` | App.tsx | Adicionar em "Identidade & Vitrine" |
| `/machine-integration` | App.tsx + BrandSidebar | Adicionar em "Plataforma" |
| `/brand-settings` | App.tsx + BrandSidebar | Adicionar em "Plataforma" |
| `/api-keys` | App.tsx + BrandSidebar | Adicionar em "Plataforma" |
| `/api-docs` | App.tsx + BrandSidebar | Adicionar em "Plataforma" |
| `/partner-landing-config` | App.tsx + BrandSidebar | Adicionar em "Identidade & Vitrine" |
| `/subscription` | App.tsx | Adicionar em "Plataforma" |
| `/send-notification` | App.tsx + BranchSidebar | Adicionar em "Operação" |
| `/ganha-ganha-store-summary` | App.tsx (rota existe?) | Verificar — parece page órfã |

### Page Builder inconsistente
- `RootSidebar` aponta para `/page-builder` (v1)
- `BrandSidebar` aponta para `/page-builder-v2`
- Ambas as rotas existem em `App.tsx`
- **Ação**: Atualizar `RootSidebar` para `/page-builder-v2` (padrão atual)

## 2. Modernizar BranchSidebar

O `BranchSidebar` é o único sidebar ainda no padrão legado:
- Usa emojis nos labels de grupo
- Não usa `CollapsibleGroup`
- Não usa `useMenuLabels` nem `useSidebarBadges`
- Não usa `PlatformLogo`
- Falta `moduleKey` em vários itens (achadinhos, notificação, PDV)

**Ação**: Reescrever para o mesmo padrão do `RootSidebar`/`BrandSidebar`:
- Grupos colapsáveis com `Collapsible`
- `useMenuLabels("admin")` + `useSidebarBadges()`
- `PlatformLogo` no header
- Remover emojis
- Adicionar `moduleKey` corretos onde falta

## Arquivos modificados

1. **`src/components/consoles/RootSidebar.tsx`** — Adicionar rotas faltantes + corrigir page-builder para v2
2. **`src/components/consoles/BranchSidebar.tsx`** — Reescrita completa no padrão colapsável moderno

