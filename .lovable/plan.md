

## Plano: Ativar módulos faltantes no sidebar do empreendedor

### Causa raiz
Os 8 itens de menu estão ocultos porque **não existem registros na tabela `brand_modules`** vinculando as marcas a essas definições de módulo. O hook `useBrandModules` retorna `false` quando não encontra registro, escondendo o item.

As `module_definitions` já existem no banco para: `domains`, `icon_library`, `app_icons`, `page_builder`, `welcome_tour`, `partner_landing`, `profile_links`, `audit`.

Porém, nenhuma das 11 marcas tem `brand_modules` rows para esses módulos.

### Solução

**1. Migração SQL** — Inserir `brand_modules` (habilitados) para todas as marcas existentes, cobrindo os 8 módulos faltantes:

```sql
INSERT INTO brand_modules (brand_id, module_definition_id, is_enabled)
SELECT b.brand_id, md.id, true
FROM (SELECT DISTINCT brand_id FROM brand_modules) b
CROSS JOIN module_definitions md
WHERE md.key IN ('domains','icon_library','app_icons','page_builder','welcome_tour','partner_landing','profile_links','audit')
ON CONFLICT DO NOTHING;
```

**2. Atualizar `provision-brand`** (se existir lógica de provisionamento) para incluir esses módulos ao criar uma nova marca, evitando reincidência futura.

### Arquivos alterados
- Migração SQL (via ferramenta de banco)
- `supabase/functions/provision-brand/index.ts` — verificar se já provisiona esses módulos

