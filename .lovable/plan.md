

## Plano: Achadinhos demo auto-populados + toggle na Dashboard

### Situação atual
- `provision-brand` e `provision-trial` criam lojas demo inline mas **não** criam affiliate deals (Achadinhos)
- `seed-demo-stores` cria tanto lojas demo quanto 20 affiliate deals, mas só é chamado manualmente (botão "Ativar Lojas Teste") ou pelo `useAutoSeedDemo` (que verifica taxonomia, não affiliate deals)
- O `DemoStoresToggle` na Dashboard só ativa/desativa lojas demo — não tem controle sobre os Achadinhos demo

### O que vou implementar

**1. Auto-seed de Achadinhos no provisionamento** — `provision-brand/index.ts` e `provision-trial/index.ts`
- Após criar as lojas demo, chamar `seed_affiliate_categories` (RPC) e inserir os 20 `DEMO_AFFILIATE_DEALS` — mesmo código que já existe em `seed-demo-stores`
- Extrair o array `DEMO_AFFILIATE_DEALS` para um bloco reutilizável dentro de cada function (edge functions não compartilham imports facilmente, então duplicar o array)

**2. Toggle de Achadinhos demo na Dashboard** — `DemoStoresToggle.tsx`
- Adicionar uma seção separada "Achadinhos Teste" com:
  - Contagem de deals demo ativos/total
  - Switch para ativar/desativar todos (update `is_active` nos `affiliate_deals` onde `store_name = 'Mercado Livre'` e `brand_id` = current)
- Manter visualmente dentro do mesmo card "Lojas Teste" existente

**3. Seed de Achadinhos no botão existente** — `seed-demo-stores/index.ts`
- Já faz isso — nenhuma mudança necessária

### Detalhes técnicos

- Para identificar deals demo: usar `store_name = 'Mercado Livre'` + brand_id (todos os demo deals usam este store_name)
- O toggle desativa/ativa em batch via `.update({ is_active })` com filtro
- No provisionamento, marcar `brand_settings_json.achadinhos_demo_seeded = true` para evitar re-seed

### Arquivos
- `supabase/functions/provision-brand/index.ts` — adicionar seed de affiliate deals
- `supabase/functions/provision-trial/index.ts` — adicionar seed de affiliate deals  
- `src/components/DemoStoresToggle.tsx` — adicionar toggle de Achadinhos demo

