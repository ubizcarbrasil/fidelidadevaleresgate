

## Diagnóstico: Por que módulos desativados ainda aparecem

Encontrei a **causa raiz real**. O problema não é cache — é que **14 módulos usados no sidebar têm `is_active = false` no banco**, então eles nunca aparecem na página de Gerenciar Módulos. O Root literalmente não consegue vê-los para desativar.

E no hook `useBrandModules`, quando não encontra o módulo, retorna `true` (mostra o menu).

### Módulos com `is_active = false` que o sidebar referencia

| Módulo | Menu no Sidebar |
|--------|----------------|
| `welcome_tour` | Boas-Vindas |
| `icon_library` | Biblioteca de Ícones |
| `page_builder` | Editor de Páginas |
| `approvals` | Aprovar Parceiros |
| `catalog` | Catálogo |
| `vouchers` | Cupons |
| `sponsored` | Patrocinados |
| `guide_brand` | Guia do Empreendedor |
| `guide_emitter` | Guia do Emissor |
| `store_permissions` | Permissão de Parceiros |
| `audit` | Auditoria |
| `ganha_ganha` | Cashback (3 menus) |
| `brand_settings` | Configurações |
| `notifications` | Notificações |

### Correção

#### 1. SQL — Ativar todos os módulos referenciados pelo sidebar

```sql
UPDATE module_definitions SET is_active = true 
WHERE key IN (
  'welcome_tour', 'icon_library', 'page_builder', 'approvals', 
  'catalog', 'vouchers', 'sponsored', 'guide_brand', 'guide_emitter',
  'store_permissions', 'audit', 'ganha_ganha', 'brand_settings', 
  'notifications', 'app_icons', 'custom_pages', 'domains',
  'points', 'points_rules', 'missions', 'home_sections',
  'theme_typography'
);
```

Isso faz com que **todos** os módulos apareçam na página de Gerenciar Módulos, permitindo que o Root ative/desative qualquer um.

#### 2. Código — Corrigir fallback do `useBrandModules`

**Arquivo:** `src/hooks/useBrandModules.ts`

Atualmente, quando não encontra o módulo, retorna `true`. Isso deve ser invertido para módulos não-core: se não existe registro em `brand_modules`, o módulo deve estar **desativado** por padrão (exceto durante carregamento).

```typescript
const isModuleEnabled = (moduleKey: string): boolean => {
  if (isRoot) return true;
  if (isLoading || !brandModules) return true; // show while loading
  const entry = brandModules.find(
    (bm: any) => (bm.module_definitions as any)?.key === moduleKey
  );
  // Se não existe registro, módulo está desativado (não mostrar por padrão)
  return entry ? entry.is_enabled : false;
};
```

Mudar o `return entry ? entry.is_enabled : false;` — o fallback atual é `false` (já está correto no código). Deixe-me reverificar...

Na verdade, olhando o código atual: `return entry ? entry.is_enabled : false;` — já retorna `false` quando não encontra. Mas o problema é que a query em `useBrandModules` filtra por `brand_id` e faz join com `module_definitions!inner(key)`. Se o `module_definitions` tem `is_active = false`, o inner join **exclui** o registro, e o hook não encontra o módulo → retorna `false`. Mas a marca tem registros em `brand_modules` para esses módulos (vi no banco: welcome_tour is_enabled:true, catalog is_enabled:false etc.).

O inner join com `module_definitions` não filtra por `is_active`, então ele deveria retornar tudo. O problema real é que **o Root não consegue ver esses módulos na página de gestão** (que filtra `is_active = true`), então não tem como desativá-los.

### Plano final (1 alteração)

**SQL Migration**: Setar `is_active = true` para TODOS os module_definitions que existem no banco. Isso garante que todos apareçam na página de Gerenciar Módulos e possam ser controlados pelo Root.

Nenhuma alteração de código é necessária — o hook e o sidebar já funcionam corretamente.

