

## Plano: Corrigir módulos desativados que continuam aparecendo

### Causa raiz
Bug de cache: duas query keys diferentes para os mesmos dados.

| Onde | Query Key |
|------|-----------|
| `BrandModulesPage.tsx` (toggle) | `["brand-modules", brandId]` |
| `useBrandModules.ts` (sidebar) | `["brand-modules-active", currentBrandId]` |

Quando o Root desativa um módulo, o `invalidateQueries` só limpa `"brand-modules"` — a sidebar usa `"brand-modules-active"` e nunca atualiza.

### Correção

**Arquivo:** `src/pages/BrandModulesPage.tsx` (linha 128)

Adicionar invalidação da query key do sidebar no `onSuccess` do toggle:

```typescript
onSuccess: () => {
  qc.invalidateQueries({ queryKey: ["brand-modules", brandId] });
  qc.invalidateQueries({ queryKey: ["brand-modules-active", brandId] });
  toast.success("Módulo atualizado!");
},
```

Isso garante que ambos os caches (página de módulos e sidebar/guards) sejam limpos ao alternar um módulo.

### Resultado
- Ao desativar um módulo na página de Gerenciar Módulos, o menu correspondente desaparece imediatamente no sidebar do empreendedor
- Ao reativar, o menu reaparece sem necessidade de refresh

