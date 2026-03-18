

## Plano: Adicionar KPI de corridas com pontuação no painel do empreendedor

### Alteração

**Arquivo:** `src/pages/BrandSettingsPage.tsx`

1. **Nova query**: Adicionar consulta à tabela `machine_rides` contando registros com `ride_status = 'FINALIZED'` e `points_credited > 0` para a marca atual (últimos 30 dias).

2. **Novo card KPI**: Adicionar um card "Corridas pontuadas (30d)" com ícone `Car` (lucide-react) mostrando a contagem.

3. **Ajustar grid**: Expandir de 6 para 7 cards no grid (ajustar `lg:grid-cols-7` ou manter responsivo).

### Resultado

Um novo card no dashboard mostrando quantas corridas do TaxiMachine geraram pontos nos últimos 30 dias, ao lado dos KPIs existentes.

