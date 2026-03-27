

## Diagnóstico Completo — 3 Problemas Pendentes

### Status atual
Os 7 itens estão **implementados no código**, e a pontuação de motoristas **já está funcionando** em produção (2 corridas reais pontuaram). Porém, há 3 bugs que precisam ser corrigidos:

---

### Problema 1: CPF/telefone/e-mail do motorista não são salvos

**Causa:** A API do condutor (`/api/integracao/condutor?id=XXXX`) retorna resposta vazia (log: `Driver details response empty`). Como o `fetchDriverDetails` retorna tudo `null`, o customer é criado sem CPF, telefone ou e-mail.

**Solução:** Na `findCustomerCascade` para motoristas, o sistema já busca por nome com tag `[MOTORISTA]`. Porém quando a API falha, precisamos de um fallback: buscar por `machine_driver_id` (ID externo do TaxiMachine). 

- Adicionar campo `external_driver_id TEXT` na tabela `customers`
- No webhook, ao criar o motorista, salvar `external_driver_id = driverId`
- Na busca do motorista, priorizar: CPF → telefone → `external_driver_id` → nome com tag
- Isso resolve também o **Problema 3** (duplicação)

### Problema 2: Erro `crm_contacts` upsert — `no unique constraint matching ON CONFLICT`

**Causa:** O código faz `upsert(..., { onConflict: "brand_id,customer_id" })`, mas o índice único é **parcial**: `WHERE customer_id IS NOT NULL`. O Supabase não consegue usar um índice parcial para ON CONFLICT.

**Solução:** Mudar a estratégia de upsert: primeiro tentar `select` por `brand_id + customer_id`, depois `insert` ou `update` conforme resultado. Isso evita o conflito com o índice parcial.

### Problema 3: Motoristas duplicados (Elizeu com 2 registros)

**Causa:** Como a API do condutor retorna vazio, `findCustomerCascade` recebe CPF=null, phone=null, e busca por nome exato `[MOTORISTA] Elizeu Fortunato Duarte`. Se houve uma race condition entre corridas processadas simultaneamente, o customer foi criado 2 vezes antes do primeiro insert retornar.

**Solução:** Resolvido pelo campo `external_driver_id` do Problema 1 (busca determinística pelo ID do TaxiMachine). Adicionalmente, deduplicar os registros existentes via merge.

---

## Plano de Implementação

### Migration: Adicionar `external_driver_id` a `customers`
```sql
ALTER TABLE customers ADD COLUMN external_driver_id TEXT;
CREATE UNIQUE INDEX idx_customers_brand_external_driver 
  ON customers(brand_id, external_driver_id) 
  WHERE external_driver_id IS NOT NULL;
```

### Editar `machine-webhook/index.ts`
1. **Nova busca prioritária para motoristas:** Antes de `findCustomerCascade`, buscar por `external_driver_id = driverId` + `brand_id`
2. **Salvar `external_driver_id`** ao criar novo motorista
3. **Fix crm_contacts upsert:** Substituir `.upsert()` por select + insert/update para ambos (passageiro e motorista)

### Deduplicação dos registros existentes
- Merge manual dos 2 registros de Elizeu via SQL (somar pontos, manter 1 registro)

### Arquivos afetados
| Arquivo | Ação |
|---------|------|
| 1 migration | Campo `external_driver_id` + índice único |
| `supabase/functions/machine-webhook/index.ts` | Busca por driver ID, salvar external_driver_id, fix crm_contacts upsert |

