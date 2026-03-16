

## Plano: Garantir controle de seções do tema via módulos

### Situação atual
O sistema **já está preparado** para controlar quais seções da "Aparência da Marca" o empreendedor pode ver. O `BrandThemeEditor` já usa `canShow("theme_colors")`, `canShow("theme_typography")`, etc., que consulta o `isModuleEnabled` baseado na tabela `brand_modules`.

O ROOT já pode ativar/desativar esses módulos na aba "Módulos" da edição da marca.

### O que falta

**Os módulos de tema não estão sendo inseridos na `brand_modules` durante o provisionamento**, então algumas marcas ficam sem esses registros — e quando não há registro, o módulo fica **oculto** (comportamento padrão do `useBrandModules`).

### Alterações

#### 1. `supabase/functions/provision-brand/index.ts`
- Após criar a marca, buscar todos os `module_definitions` com `is_active = true`
- Inserir registros em `brand_modules` para cada um, com `is_enabled` baseado no plano:
  - **basic/free**: ativar apenas `theme_colors`, `theme_images`, `theme_texts` (ocultar `theme_typography`, `theme_layout`, `theme_offer_cards`)
  - **starter/profissional**: ativar todos

#### 2. Corrigir marcas existentes (via INSERT data)
- Inserir os `brand_modules` faltantes para as 12 marcas existentes, garantindo que todas tenham registros para