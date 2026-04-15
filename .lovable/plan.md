

## Correção: Achadinhos no App do Cliente + Flags de Cidade

### Problema

1. **RLS bloqueia `brand_modules` para anônimos** — O `useBrandModules` consulta `brand_modules`, mas a política RLS só permite `authenticated`. Clientes "Visitante" (anônimos) recebem array vazio, fazendo `isModuleEnabled("affiliate_deals")` retornar `false` e escondendo Achadinhos, Banners, Categorias, etc.

2. **Toggles da cidade não afetam o app do cliente** — O admin altera `enable_achadinhos_module` no `branch_settings_json`, mas o `CustomerHomePage` só verifica `brand_modules` (nível marca). A flag da cidade é ignorada — só o app do motorista a usa.

### Solução

**A) Migração: RLS pública para leitura de `brand_modules`**

Adicionar política `anon SELECT` na tabela `brand_modules` (não contém dados sensíveis).

```sql
CREATE POLICY "Anon can read brand_modules"
  ON brand_modules FOR SELECT TO anon USING (true);
```

**B) `CustomerHomePage.tsx`: respeitar flags da cidade**

Adicionar mapeamento de flags de `branch_settings_json` por seção nativa:

- `ACHADINHOS` → `enable_achadinhos_module === true`
- `COMPRE_COM_PONTOS` → `enable_points_purchase === true`

Se a flag estiver ausente (`undefined`), usar o fallback do módulo de marca (comportamento atual). Se estiver explicitamente `false`, esconder.

### Arquivos afetados

1. **Nova migração SQL** — Política RLS pública em `brand_modules`
2. **`src/pages/customer/CustomerHomePage.tsx`** — Verificação de `branch_settings_json` em `isNativeSectionVisible`

### Detalhes técnicos

```typescript
// CustomerHomePage.tsx
const branchSettings = selectedBranch?.branch_settings_json as Record<string, any> | null;

const BRANCH_FLAG_MAP: Record<string, string> = {
  ACHADINHOS: "enable_achadinhos_module",
  COMPRE_COM_PONTOS: "enable_points_purchase",
};

const isNativeSectionVisible = (ns: NativeSectionConfig) => {
  if (!ns.enabled) return false;
  const moduleKey = SECTION_MODULE_MAP[ns.key];
  if (moduleKey && !isModuleEnabled(moduleKey)) return false;
  // City-level override
  const branchFlag = BRANCH_FLAG_MAP[ns.key];
  if (branchFlag && branchSettings && branchFlag in branchSettings) {
    if (branchSettings[branchFlag] !== true) return false;
  }
  const audience = ns.audience || "all";
  if (audience === "driver_only" && !isDriver) return false;
  if (audience === "customer_only" && isDriver) return false;
  return true;
};
```

