

## Plano: Integração CRM ↔ Fidelidade com Tiers de Cliente e Regras de Pontuação Diferenciadas

### Resumo

Conectar as tabelas `crm_contacts` e `customers` bidirecionalmente, criar um sistema de classificação por corridas (Galáctico, Lendário, Diamante, etc.) e permitir regras de pontuação diferenciadas por tier.

---

### 1. Migration SQL — Schema Changes

**Tabela `customers`** — adicionar campos de vínculo CRM e tier:
```sql
ALTER TABLE customers ADD COLUMN crm_contact_id uuid REFERENCES crm_contacts(id);
ALTER TABLE customers ADD COLUMN crm_sync_status text DEFAULT 'NONE' 
  CHECK (crm_sync_status IN ('SYNCED','PENDING','NONE'));
ALTER TABLE customers ADD COLUMN ride_count integer DEFAULT 0;
ALTER TABLE customers ADD COLUMN customer_tier text DEFAULT 'INICIANTE'
  CHECK (customer_tier IN ('INICIANTE','BRONZE','PRATA','OURO','DIAMANTE','LENDARIO','GALATICO'));
```

**Nova tabela `tier_points_rules`** — regras de multiplicador por tier:
```sql
CREATE TABLE tier_points_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES brands(id) NOT NULL,
  branch_id uuid REFERENCES branches(id) NOT NULL,
  tier text NOT NULL CHECK (tier IN ('INICIANTE','BRONZE','PRATA','OURO','DIAMANTE','LENDARIO','GALATICO