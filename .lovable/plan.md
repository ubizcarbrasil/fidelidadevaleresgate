

# Corrigir controle de duplicidade: separar notificações PASSENGER vs DRIVER

## Problema
A function `notify-driver-points` verifica duplicidade por `machine_ride_id + brand_id + driver_name`, mas o fluxo do passageiro no `machine-webhook` já insere um registro na `machine_ride_notifications` antes. Dependendo do `driver_name`, o filtro pode conflitar.

## Solução

### 1. Migration: adicionar coluna `notification_type`
```sql
ALTER TABLE machine_ride_notifications 
  ADD COLUMN notification_type text NOT NULL DEFAULT 'PASSENGER';
```
Registros existentes ficam como `'PASSENGER'` automaticamente.

### 2. Atualizar `notify-driver-points`
- Trocar a query de dedup para filtrar por `machine_ride_id + brand_id + notification_type = 'DRIVER'` (remover filtro por `driver_name`).
- Após envio com sucesso, inserir registro com `notification_type: 'DRIVER'`.

### 3. Webhook do passageiro (`machine-webhook`)
Já grava com o default `'PASSENGER'`, nenhuma alteração necessária. Opcionalmente, adicionar `notification_type: 'PASSENGER'` explicitamente para clareza.

## Arquivos

| Arquivo | Alteração |
|---|---|
| DB migration | `ADD COLUMN notification_type` |
| `supabase/functions/notify-driver-points/index.ts` | Dedup por `notification_type = 'DRIVER'` + inserir com `notification_type: 'DRIVER'` |
| `supabase/functions/machine-webhook/index.ts` | Adicionar `notification_type: 'PASSENGER'` explícito no insert (opcional) |

