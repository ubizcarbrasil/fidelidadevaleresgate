

## Problema identificado

Existem **2.531 clientes** na tabela `customers` (brand `8f76ce52...`) que **não possuem registro correspondente** na tabela `crm_contacts`. Esses clientes foram criados entre 15:42 e 21:50 do dia 12/03, mas o espelhamento para o CRM falhou ou nunca ocorreu.

Os import jobs do tipo `CRM_CONTACTS` estão com status `IMPORTING` (travados), sugerindo que houve falha durante a inserção dos contatos CRM — os customers foram criados mas os crm_contacts correspondentes não.

## Solução

Duas ações:

### 1. Backfill: sincronizar clientes existentes para o CRM
Criar um script de migração (via insert tool) que insira na `crm_contacts` todos os clientes que ainda não têm correspondência:

```sql
INSERT INTO crm_contacts (brand_id, branch_id, customer_id, name, phone, cpf, source, is_active)
SELECT c.brand_id, c.branch_id, c.id, c.name, c.phone, c.cpf, 'STORE_UPLOAD', c.is_active
FROM customers c
WHERE c.brand_id = '8f76ce52-d6c0-4c90-af67-79957e97e477'
  AND c.id NOT IN (
    SELECT customer_id FROM crm_contacts 
    WHERE brand_id = '8f76ce52-d6c0-4c90-af67-79957e97e477' 
      AND customer_id IS NOT NULL
  );
```

### 2. Corrigir import jobs travados
Atualizar os jobs com status `IMPORTING` para `FAILED`:

```sql
UPDATE import_jobs SET status = 'FAILED', finished_at = now()
WHERE brand_id = '8f76ce52-d6c0-4c90-af67-79957e97e477' AND status = 'IMPORTING';
```

### 3. Prevenir no futuro: melhorar resiliência do CSV import
No `CsvImportPage.tsx`, no fluxo `CUSTOMERS` (linhas 351-395), o código insere clientes em batch e depois tenta inserir crm_contacts. Se a inserção de crm_contacts falha, os clientes já foram criados sem correspondência CRM. 

Melhoria: adicionar retry/fallback — se o batch de crm_contacts falhar, tentar inserir um a um para maximizar sincronização.

## Resultado esperado
- Os 2.531 clientes órfãos aparecerão no CRM imediatamente após o backfill.
- Futuras importações de clientes terão melhor resiliência no espelhamento CRM.

