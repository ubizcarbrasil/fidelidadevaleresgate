

# Extrato detalhado de pontos no painel do motorista

## Problema
1. O clique no card de pontos abre o perfil completo — o usuário quer que abra direto o **extrato detalhado**
2. O extrato atual não mostra a **origem** dos pontos (corrida, bônus manual, resgate, etc.)
3. A query do extrato bate no RLS e provavelmente retorna vazio (mesmo problema do login por CPF)

## Solução

### 1. Migração — Função `get_driver_ledger`
Criar função `SECURITY DEFINER` que retorna o extrato do motorista incluindo `reference_type`, `reason`, `money_amount` e dados da filial:

```sql
CREATE OR REPLACE FUNCTION public.get_driver_ledger(p_customer_id uuid)
RETURNS TABLE(
  id uuid, entry_type text, points_amount numeric, money_amount numeric,
  reason text, reference_type text, created_at timestamptz, branch_name text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT l.id, l.entry_type::text, l.points_amount, l.money_amount,
         l.reason, l.reference_type::text, l.created_at,
         b.name AS branch_name
  FROM points_ledger l
  LEFT JOIN branches b ON b.id = l.branch_id
  WHERE l.customer_id = p_customer_id
  ORDER BY l.created_at DESC
  LIMIT 100;
$$;
```

### 2. Novo overlay — `DriverLedgerOverlay.tsx`
Tela fullscreen (mesmo padrão do `DriverProfileOverlay`) dedicada ao extrato:

- **Header**: Seta voltar + "Extrato de pontos"
- **Card de saldo**: Mesmo visual do card na home (gradient primary)
- **Lista de movimentações**: Cada item mostra:
  - Ícone de origem (🚗 corrida, 🛒 compra/earning, 🎁 bônus manual, 🎟 resgate)
  - **Label traduzido** do `reference_type`: MACHINE_RIDE → "Corrida", EARNING_EVENT → "Compra", MANUAL_ADJUSTMENT → "Bonificação", REDEMPTION → "Resgate"
  - Campo `reason` (anotação do admin) exibido como subtexto — é aqui que o motorista vê a origem customizada
  - Data/hora formatada em pt-BR
  - Badge de pontos (+/- colorido)
  - Nome da filial quando disponível

### 3. Alterar clique no card de pontos (`DriverMarketplace.tsx`)
- O botão de pontos no header abre o novo `DriverLedgerOverlay` em vez do perfil
- O botão de perfil (ícone de usuário) continua abrindo o `DriverProfileOverlay`

### 4. Atualizar `DriverProfileOverlay.tsx`
- Usar a mesma RPC `get_driver_ledger` em vez da query direta (corrige o RLS)
- Adicionar `reference_type` na exibição do extrato que já existe lá

### Arquivos

| Arquivo | Ação |
|---------|------|
| Migração SQL | Nova função `get_driver_ledger` |
| `src/components/driver/DriverLedgerOverlay.tsx` | **Novo** — overlay fullscreen do extrato |
| `src/components/driver/DriverMarketplace.tsx` | Editar — card de pontos abre o ledger overlay |
| `src/components/driver/DriverProfileOverlay.tsx` | Editar — usar RPC e mostrar `reference_type` |

