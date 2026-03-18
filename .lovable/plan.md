
Diagnóstico

- Pelos prints, você está olhando a página principal do empreendedor (dashboard). A logo da marca foi implementada na tela errada: hoje ela aparece em `BrandSettingsPage`, mas o pedido original foi “na página principal”.
- Encontrei um problema estrutural de visibilidade: para a marca `Ubiz Resgata`, faltam registros em `brand_modules` para os módulos `brand_settings` e `csv_import`. Resultado:
  - “Configurações” não aparece no menu.
  - “Importação de Dados” não aparece no menu.
  - a rota `/brand-settings` também fica bloqueada pelo `ModuleGuard`.
- O CSV “Pontuação Manual” existe no código e aparece na UI de `CsvImportPage`, mas ainda há um bug funcional importante: o insert em `earning_events` usa `store_id: branchId`, porém `store_id` é obrigatório e referencia uma loja real (`stores.id`). Ou seja: mesmo liberando a tela, a importação manual ainda pode falhar.
- O painel do parceiro já renderiza a logo da loja em `StoreOwnerPanel`, mas hoje o acesso real do lojista está frágil: quase todas as lojas dessa marca estão sem `owner_user_id`, então o fluxo de login do parceiro não é um caminho confiável para validar a feature.

Plano

1. Corrigir o local da logo da marca
- Arquivo: `src/pages/Dashboard.tsx`
- Adicionar a logo da marca no header principal do dashboard (“Bom dia”), para aparecer exatamente na tela que você mostrou.
- Usar `BrandContext`/`useBrand()` em vez de depender só de `useBrandInfo`, para funcionar melhor em todos os contextos.

2. Corrigir a visibilidade de “Configurações” e “Importação de Dados”
- Arquivos: `src/components/consoles/BrandSidebar.tsx`, `src/App.tsx`, possivelmente `src/hooks/useBrandModules.ts`
- Ajustar o gating para marcas antigas:
  - `brand-settings` não pode ficar invisível só porque a marca não recebeu o módulo novo.
  - `/csv-import` e o item do menu precisam usar a mesma regra de acesso; hoje estão inconsistentes (`csv_import` no menu e `stores` na rota).

3. Tratar o problema de legado em módulos
- Backend/database: criar um backfill para inserir `brand_modules` faltantes em marcas antigas para novos `module_definitions`.
- Isso evita repetir o mesmo bug com outras telas novas além de “Configurações” e “Importação de Dados”.

4. Finalizar corretamente a “Pontuação Manual”
- Arquivo: `src/pages/CsvImportPage.tsx`
- Corrigir o fluxo para usar um `store_id` real.
- Como o CSV pedido não tem coluna de loja, a solução mais segura é adicionar um seletor de loja na tela (ou tornar loja uma coluna opcional do CSV com fallback para um seletor).
- Depois disso, manter o restante: localizar/criar cliente, calcular pontos pela regra ativa, lançar `earning_events`, `points_ledger` e atualizar saldo.

5. Tornar o painel do parceiro validável de verdade
- Arquivos: `src/pages/Dashboard.tsx` e/ou `src/pages/StoreOwnerPanel.tsx`
- Melhorar o acesso de preview do empreendedor para abrir um parceiro específico com `storeId`.
- Se necessário, revisar o vínculo de acesso do parceiro (`owner_user_id`) para que o lojista realmente veja o painel da própria loja.

Detalhes técnicos

- A migration `supabase/migrations/20260316013652_536efadf-713a-4afb-8490-51c4b2aca217.sql` criou os módulos `brand_settings` e `csv_import`, mas não fez backfill em `brand_modules` para marcas já existentes.
- No banco, a marca `Ubiz Resgata` tem logo configurada e tem módulos como `stores` e `offers` ativos, mas não tem rows para `brand_settings` e `csv_import`, o que bate exatamente com o menu que aparece nos seus prints.
- O item do parceiro já foi implementado visualmente, então ali o problema principal não é layout: é acesso/dados de vínculo da loja com usuário parceiro.
