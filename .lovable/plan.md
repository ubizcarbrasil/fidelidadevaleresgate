

## Plano: Corrigir extrato de pontos do motorista

### Problema
O motorista tem 34 pontos de saldo e +34 de corridas, mas o extrato mostra "Nenhuma movimentação encontrada". Os pontos SÃO inseridos no `points_ledger` pelo webhook da máquina (linha 664 do `machine-webhook/index.ts`), então o problema é que a query falha silenciosamente — provavelmente por RLS ou erro não tratado.

### Causa provável
A política RLS "Select points_ledger (admin)" exige `user_has_permission(auth.uid(), 'earn_points')` E match de `brand_id`/`branch_id`. Se o admin logado não tem a permissão `earn_points` configurada, o SELECT retorna vazio sem erro.

### Solução (2 frentes)

**1. Adicionar política RLS mais abrangente para admins de marca**
Criar nova política que permita SELECT no `points_ledger` para usuários com permissão de `manage_drivers` ou `view_reports` (não apenas `earn_points`), já que o extrato é uma funcionalidade de leitura/consulta:

```sql
CREATE POLICY "Select points_ledger (brand admin)"
ON public.points_ledger FOR SELECT
USING (
  (user_has_permission(auth.uid(), 'manage_drivers'::text)
   OR user_has_permission(auth.uid(), 'view_reports'::text)
   OR user_has_permission(auth.uid(), 'earn_points'::text))
  AND (
    brand_id IN (SELECT get_user_brand_ids(auth.uid()))
    OR brand_id IN (SELECT b.id FROM brands b WHERE b.tenant_id IN (SELECT get_user_tenant_ids(auth.uid())))
    OR branch_id IN (SELECT get_user_branch_ids(auth.uid()))
  )
);
```

**2. Melhorar o componente `DriverLedgerSection`**
- Adicionar tratamento de erro visível (mostrar mensagem de erro ao invés de "nenhuma movimentação")
- Adicionar `brand_id` como filtro opcional na query para melhor performance
- Invalidar a query do extrato após bonificação manual (adicionar `driver-ledger-detail` ao `ManualDriverScoringDialog`)

### Arquivos a editar
| Arquivo | Alteração |
|---------|-----------|
| Nova migração SQL | Adicionar política RLS para leitura do extrato |
| `DriverLedgerSection.tsx` | Exibir erro quando query falha |
| `ManualDriverScoringDialog.tsx` | Invalidar `driver-ledger-detail` após crédito |

### Verificação de permissões existentes
Antes de criar a migração, verificar quais permissões (`manage_drivers`, `view_reports`) já existem na tabela de permissões para garantir compatibilidade.

