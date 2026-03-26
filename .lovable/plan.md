

## Corrigir importação DVLinks: mais produtos e melhor categorização

### Problema 1 — Poucos produtos importados
O site dvlinks.com.br tem ~35 páginas com ~10 produtos cada (~350 produtos). O limite padrão de `max_pages` está em **5**, importando apenas ~50 produtos.

### Problema 2 — Categorização falha
Os deals do DVLinks não trazem campo `category` da fonte. A categorização depende 100% de matching por keywords no título. Produtos com títulos genéricos ou sem palavras-chave cadastradas ficam sem categoria (vão para "Ofertas Variadas").

### Correções

**1. Edge Function `mirror-sync/index.ts`**
- Aumentar `max_pages` padrão de 5 para **40** (para capturar todas as páginas, parando automaticamente quando encontrar "Nenhum produto encontrado")
- Adicionar detecção de página vazia via texto "Nenhum produto encontrado" no HTML (stop antecipado mais confiável)
- Melhorar a categorização para DVLinks: reduzir `MIN_SCORE` de 4 para **3** quando a fonte é DVLinks (títulos curtos perdem match com score 4)
- Após inserção de cada deal DVLinks, executar `matchDealToCategory` imediatamente e salvar `category_id` no insert/update (em vez de depender apenas da fase posterior de auto-categorização)

**2. UI — `MirrorSyncConfig.tsx`**
- Alterar o valor padrão do campo "Máx. páginas" de 5 para **40**

### O que NÃO muda
- Fluxo do Divulgador Inteligente
- Estrutura de tabelas
- Lógica de keyword matching (apenas threshold reduzido)
- RLS, auth, guards

