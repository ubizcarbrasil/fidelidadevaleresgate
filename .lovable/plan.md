

# Plano: Correção Estrutural de Domínios White-Label

## Status Atual

| Etapa | Status | Detalhe |
|-------|--------|---------|
| **View `public_brands_safe`** | ⚠️ Parcial | Criada COM `security_invoker=on` — bloqueia anônimos. Precisa recriar SEM essa opção + GRANT |
| **Sanitização de domínios no banco** | ❌ Pendente | Domínios com `https://` precisam de UPDATE |
| **Roteamento inteligente (App.tsx)** | ✅ Pronto | Lógica brand_admin/branch_admin já implementada (linhas 364-386) |
| **BrandContext usa view pública** | ✅ Pronto | `fetchBrandById` já tenta `public_brands_safe` primeiro |
| **Sanitização de hostname no código** | ❌ Pendente | `resolveBrandByDomain` não limpa protocolo |
| **Sanitização na escrita de domínios** | ❌ Pendente | `PaginaDominiosMarca.tsx` e `BrandDomains.tsx` salvam domínio como digitado |
| **Central de Acessos hierárquica** | ✅ Pronto | `AccessHubPage.tsx` já reformulada com drill-down |

## O Que Será Feito

### Etapa 1 — Migration SQL (corrige o bug principal)

Nova migration que:
1. Recria `public_brands_safe` **SEM** `security_invoker` (executa como owner, bypassa RLS da tabela base)
2. Adiciona `GRANT SELECT` para `anon` e `authenticated`
3. Sanitiza domínios existentes removendo `https://` e `http://`

```sql
DROP VIEW IF EXISTS public.public_brands_safe;
CREATE VIEW public.public_brands_safe AS
SELECT id, name, slug, is_active, subscription_status, tenant_id,
       default_theme_id, home_layout_json, brand_settings_json,
       created_at, trial_expires_at
FROM public.brands;

GRANT SELECT ON public.public_brands_safe TO anon, authenticated;

UPDATE public.brand_domains
SET domain = REGEXP_REPLACE(domain, '^https?://', '')
WHERE domain ~ '^https?://';
```

### Etapa 2 — BrandContext.tsx

Adicionar sanitização de hostname no início de `resolveBrandByDomain`:

```typescript
hostname = hostname.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase().trim();
```

### Etapa 3 — Sanitização na escrita (2 arquivos)

Em `PaginaDominiosMarca.tsx` e `BrandDomains.tsx`, ao salvar domínio, limpar protocolo e barras:

```typescript
const cleanDomain = domain.toLowerCase().trim()
  .replace(/^https?:\/\//, '')
  .replace(/\/$/, '');
```

### Arquivos Envolvidos

| Arquivo | Ação |
|---------|------|
| Nova migration SQL | Criar — recriar view + sanitizar dados |
| `src/contexts/BrandContext.tsx` | Editar — sanitizar hostname |
| `src/pages/PaginaDominiosMarca.tsx` | Editar — sanitizar domínio ao salvar |
| `src/pages/BrandDomains.tsx` | Editar — sanitizar domínio ao salvar |

As etapas de roteamento inteligente (App.tsx) e Central de Acessos (AccessHubPage.tsx) **já estão implementadas** e não precisam de mudanças adicionais.

