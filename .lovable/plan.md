

## Plano: Etapas 4–6 da Revisão Técnica (Restantes)

As etapas 1–3 já foram concluídas (performance, deduplicação, robustez básica). Restam:

---

### Etapa 4: Segurança de Rotas (completar)

Várias rotas administrativas ainda não têm `RootGuard` — qualquer usuário autenticado pode acessá-las:

| Rota | Guard necessário |
|------|-----------------|
| `provision-brand` | `RootGuard` |
| `taxonomy` | `RootGuard` |
| `starter-kit` | `RootGuard` |
| `platform-theme` | `RootGuard` |
| `app-icons` | `RootGuard` |
| `welcome-tour` | `RootGuard` |
| `profile-links` | `RootGuard` |
| `ganha-ganha-dashboard` | `RootGuard` |
| `sponsored-placements` | `RootGuard` |
| `machine-integration` | `RootGuard` |
| `machine-webhook-test` | `RootGuard` |
| `offer-card-config` | `RootGuard` |
| `modules` | `RootGuard` |
| `flags` | `RootGuard` |
| `releases` | `RootGuard` |
| `icon-library` | `RootGuard` |
| `brand-permissions` | `RootGuard` |

**Ação**: Envolver essas rotas com `<RootGuard>` no `App.tsx`.

---

### Etapa 5: Limpeza de código

1. **Remover `as any` casts** no Dashboard (`useMetric` e queries) — substituir por tipagem correta ou `unknown` com narrowing
2. **Padronizar imports** — garantir que todas as páginas CRUD usem `useDebouncedSearch` (verificar se `RedemptionsPage` e `CustomersPage` foram migrados)

---

### Etapa 6: UX — Empty States e Feedback

1. **Adicionar `AlertDialog` de confirmação** nas