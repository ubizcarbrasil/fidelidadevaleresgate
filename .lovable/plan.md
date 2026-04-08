

## Alinhar Permissões ao Modelo de Negócio da Cidade

### Problema
A página de Permissões dos Parceiros (`BrandPermissionOverflowPage`) não leva em conta o `scoring_model` da cidade selecionada. Quando você seleciona Leme (DRIVER_ONLY), permissões de módulos voltados ao cliente (ofertas, resgates, cupons) continuam habilitadas, gerando inconsistência.

### Solução
Adicionar consciência do modelo de negócio na página de permissões, com:

1. **Indicador visual do modelo** — Ao selecionar uma cidade, exibir um badge com o scoring_model (🚗 Motorista, 👤 Cliente, 🔄 Ambos)

2. **Mapeamento de contexto por módulo** — Constante que classifica cada módulo de permissão como `DRIVER`, `PASSENGER` ou `UNIVERSAL`:
   - PASSENGER: `offers`, `redemptions`, `vouchers`, `catalog`
   - DRIVER: (módulos futuros de gestão de motorista)
   - UNIVERSAL: `stores`, `customers`, `reports`, `settings`, `branches`, `users`, `roles`, `loyalty`, `points_rules`, etc.

3. **Tag visual por permissão** — Badge colorido indicando se a permissão é de contexto motorista (🟢), cliente (🔴) ou universal (sem badge)

4. **Botão "Alinhar ao Modelo"** — Ação rápida que:
   - Num cidade DRIVER_ONLY → desativa automaticamente todas as permissões de módulos PASSENGER
   - Num cidade PASSENGER_ONLY → desativa automaticamente todas as permissões de módulos DRIVER
   - Num cidade BOTH → não altera nada (mostra toast informativo)
   - Aplica apenas como alterações locais (precisa salvar depois)

5. **Permissões fora do modelo ficam visualmente esmaecidas** — Opacity reduzida e badge "Fora do modelo" quando uma permissão não se aplica ao scoring_model da cidade selecionada

### Arquivos modificados

- `src/pages/BrandPermissionOverflowPage.tsx` — Buscar `scoring_model` da branch selecionada, adicionar mapeamento de contexto, badge do modelo, botão "Alinhar ao Modelo", visual esmaecido para permissões fora do contexto

### Fluxo do Usuário
```text
Permissões → Seleciona cidade "Leme" → Badge [🚗 Apenas Motorista]
→ Permissões de cliente (ofertas, resgates, cupons) aparecem esmaecidas com badge "Fora do modelo"
→ Botão [Alinhar ao Modelo] → Desativa automaticamente permissões de cliente
→ [Salvar]
```

### Detalhes técnicos
- Busca `scoring_model` da branch selecionada via query existente (já carrega branches, basta incluir `scoring_model` no select)
- Mapeamento é uma constante no código (sem migration), pois os módulos de permissão já existem
- O botão "Alinhar" apenas manipula `localChanges`, sem salvar automaticamente
- Não altera a lógica de salvamento existente

