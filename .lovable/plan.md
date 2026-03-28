

# Fix Badge forwardRef + Lista Final de Go-Live

## 1. Correção do Badge (simples, sem risco)

O `Badge` é um componente simples que renderiza um `<div>`. O fix é apenas adicionar `React.forwardRef` — padrão shadcn. Mudança de 3 linhas, zero risco funcional.

**Arquivo:** `src/components/ui/badge.tsx`

**Alteração:**
```tsx
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />;
  }
);
Badge.displayName = "Badge";
```

---

## 2. Lista Final de Go-Live

### Corrigido nesta etapa completa de auditoria
1. 4 rotas protegidas com guards (`/home-templates`, `/clone-branch`, `/page-builder`, `/driver-config`)
2. 5 edge functions migradas de `getClaims()` para `getUser()`
3. `publicPaths` atualizado com `/p/` e `/driver`
4. DialogTitle adicionado ao `CommandDialog` (acessibilidade)
5. KpiCard duplicado removido do Dashboard
6. `setPeriod` com `startTransition` (INP)
7. Realtime com debounce de 120ms (re-renders)
8. Charts -1px corrigidos com height fixo e minWidth/minHeight
9. Badge com `forwardRef` (este fix)

### Para pós go-live (não crítico)
1. Refatorar Dashboard.tsx em sub-componentes
2. Refatorar StoresPage.tsx e CustomersPage.tsx
3. Monitoramento de Web Vitals em produção
4. Migração gradual para arquitetura feature-based
5. Batch inserts no provision-brand (otimização)

### Recomendação final
**PODE PUBLICAR.** Nenhuma pendência crítica aberta. Sistema seguro, estável e funcional.

