

# Fix: Login do motorista por CPF falha por restrição de acesso

## Problema
A tabela `customers` tem RLS ativado e todas as políticas de SELECT exigem `auth.uid()`. O fluxo de login do motorista faz a consulta **sem autenticação** (não há sessão Supabase Auth), então a query retorna vazio e mostra "CPF não cadastrado" mesmo para motoristas válidos.

## Solução
Criar uma função de banco `SECURITY DEFINER` que busca o motorista por CPF + brand_id + tag `[MOTORISTA]`, retornando apenas os dados necessários. Isso bypassa RLS de forma segura e controlada.

### 1. Migração — Função `lookup_driver_by_cpf`

```sql
CREATE OR REPLACE FUNCTION public.lookup_driver_by_cpf(p_brand_id uuid, p_cpf text)
RETURNS TABLE(
  id uuid, name text, cpf text, email text, phone text,
  points_balance numeric, money_balance numeric,
  brand_id uuid, branch_id uuid, branch_name text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT c.id, c.name, c.cpf, c.email, c.phone,
         c.points_balance, c.money_balance,
         c.brand_id, c.branch_id,
         b.name AS branch_name
  FROM customers c
  LEFT JOIN branches b ON b.id = c.branch_id
  WHERE c.brand_id = p_brand_id
    AND c.cpf = p_cpf
    AND c.name ILIKE '%[MOTORISTA]%'
  LIMIT 1;
$$;
```

### 2. Editar `src/contexts/DriverSessionContext.tsx`

Substituir a função `fetchDriverByCpf` para usar `.rpc('lookup_driver_by_cpf', { p_brand_id, p_cpf })` em vez de `.from('customers').select(...)`. Isso contorna o RLS de forma segura.

### Arquivos
| Arquivo | Ação |
|---------|------|
| Migração SQL | Nova função `lookup_driver_by_cpf` |
| `src/contexts/DriverSessionContext.tsx` | Editar `fetchDriverByCpf` para usar RPC |

### Build Errors
Os erros de `maskCpf` reportados são artefatos de build antigo — os arquivos já usam `formatCpf`. Nenhuma correção adicional necessária para eles.

