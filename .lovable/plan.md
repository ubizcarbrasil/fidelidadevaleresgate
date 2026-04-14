

## Problema: Não é possível renovar/reativar assinatura pelo painel Root

### Diagnóstico

O menu "Mudar Plano" na listagem de Marcas (`/brands`) apenas atualiza o campo `subscription_plan` (ex: free → starter → pro). Porém, quando uma marca tem o `subscription_status` como `EXPIRED` ou `TRIAL` expirado, **não existe nenhuma ação no painel Root para mudar o status da assinatura para `ACTIVE`** nem para estender o `trial_expires_at`.

O `TrialExpiredBlocker` bloqueia a marca quando `subscription_status = EXPIRED` ou quando o trial venceu — e o Root Admin não tem como desbloquear isso manualmente.

### Solução

**1. Nova ação na Edge Function `admin-brand-actions`**: `renew_subscription`

Receberá: `brand_id`, `new_status` (ACTIVE, TRIAL, NONE), e opcionalmente `trial_days` (para estender trial).

```sql
UPDATE brands SET
  subscription_status = new_status,
  trial_expires_at = CASE WHEN new_status = 'TRIAL' THEN now() + interval 'X days' ELSE NULL END
WHERE id = brand_id;
```

**2. Novo item no dropdown de ações da marca** (`src/pages/Brands.tsx`)

Adicionar opção "Renovar Assinatura" no menu de contexto de cada marca, abrindo um dialog simples com:
- Select: status (Ativo, Trial, Expirado)
- Input condicional: dias de trial (quando status = Trial)
- Botão confirmar

**3. Exibir `subscription_status` na tabela de marcas**

Adicionar uma coluna mostrando o status atual (ACTIVE/TRIAL/EXPIRED) para o Root Admin ter visibilidade.

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/admin-brand-actions/index.ts` | Nova ação `renew_subscription` |
| `src/pages/Brands.tsx` | Novo item no dropdown + dialog de renovação + coluna de status da assinatura |

### Resultado
O Root Admin poderá renovar/reativar qualquer marca diretamente pela listagem de marcas, escolhendo entre ativar a assinatura ou estender o período de trial.

