

## Plano: Ativar duelos por padrão para todas as cidades

### Problema atual
O hook `useConfigDuelos` retorna `false` como padrão para `duelosAtivos`, `rankingAtivo` e `cinturaoAtivo` quando a cidade não tem configuração explícita no `branch_settings_json`. Isso exige que o admin ative manualmente cada recurso em cada cidade.

### Solução
Inverter a lógica dos defaults: em vez de desativado por padrão, ativar por padrão. O admin ainda poderá desativar manualmente se quiser.

### Arquivos a modificar

**1. `src/components/driver/duels/hook_config_duelos.ts`**
- Alterar `DEFAULTS` para `duelosAtivos: true`, `rankingAtivo: true`, `cinturaoAtivo: true`, `visualizacaoPublica: true`
- Alterar a lógica de leitura: em vez de `s.enable_driver_duels === true`, usar `s.enable_driver_duels !== false` (ou seja, é ativo a menos que explicitamente desativado)

**2. `src/pages/BrandBranchForm.tsx`**
- Alterar os `useState` iniciais de `enableDriverDuels`, `enableCityRanking`, `enableCityBelt` para `true` por padrão (quando não há configuração existente)

**3. `src/components/admin/gamificacao/ConfiguracaoModulo.tsx`**
- Alterar os `useState` iniciais para considerar `!== false` em vez de `=== true`, mantendo coerência com a nova lógica

### Comportamento resultante
- Cidades **sem** configuração explícita → duelos, ranking e cinturão **ativos**
- Cidades com `enable_driver_duels: false` explícito → duelos **desativados**
- Admin pode desativar a qualquer momento pela tela de Configuração

