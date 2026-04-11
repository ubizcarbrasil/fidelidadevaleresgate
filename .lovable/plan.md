

## Plano: Corrigir erro de enum no ManualCustomerScoringDialog

### Problema
O erro `invalid input value for enum ledger_reference_type: "MANUAL_BONUS"` ocorre porque o valor `MANUAL_BONUS` não existe no enum `ledger_reference_type`. Os valores válidos incluem `MANUAL_ADJUSTMENT`.

### Mudanças

**Arquivo 1**: `src/components/machine-integration/ManualCustomerScoringDialog.tsx`
- Alterar `reference_type: "MANUAL_BONUS"` para `reference_type: "MANUAL_ADJUSTMENT"`

**Arquivo 2**: `src/components/machine-integration/ManualDriverScoringDialog.tsx`
- Mesma correção: `reference_type: "MANUAL_BONUS"` → `reference_type: "MANUAL_ADJUSTMENT"`

### Detalhes técnicos
- Nenhuma migração necessária — o valor `MANUAL_ADJUSTMENT` já existe no enum
- Ambos os dialogs (cliente e motorista) usam o valor incorreto e precisam ser corrigidos

