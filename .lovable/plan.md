

## Correção: Adicionar valores de duelo ao enum `ledger_reference_type`

### Problema confirmado
O enum `ledger_reference_type` no banco possui apenas: `EARNING_EVENT`, `REDEMPTION`, `MANUAL_ADJUSTMENT`, `MACHINE_RIDE`.

As RPCs de duelo (`respond_to_duel`, `respond_counter_proposal`, `finalize_duel`) tentam inserir `DUEL_RESERVE`, `DUEL_WIN` e `DUEL_REFUND`, causando o erro ao aceitar desafios.

### Solução
Uma única migração SQL:

```sql
ALTER TYPE public.ledger_reference_type ADD VALUE IF NOT EXISTS 'DUEL_RESERVE';
ALTER TYPE public.ledger_reference_type ADD VALUE IF NOT EXISTS 'DUEL_WIN';
ALTER TYPE public.ledger_reference_type ADD VALUE IF NOT EXISTS 'DUEL_REFUND';
ALTER TYPE public.ledger_reference_type ADD VALUE IF NOT EXISTS 'DRIVER_RIDE';
```

### Impacto
- Nenhuma alteração de código frontend ou edge function necessária
- As RPCs já utilizam esses valores, faltava apenas registrá-los no enum
- Após a migração, aceitar desafios e finalizar duelos funcionará normalmente

