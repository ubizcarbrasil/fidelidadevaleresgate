

## Problema

O link "Achadinho Motorista" nos Links Úteis do dashboard é o único caminho para o painel do motorista (`/driver?brandId=...`). Na correção anterior, adicionamos a condição que oculta esse link quando `affiliate_deals` está desativado (linha 93). Como resultado, **o empreendedor perdeu completamente o acesso ao painel do motorista**.

O painel do motorista não é apenas Achadinhos — inclui hub, pontos, perfil, extrato, resgate na cidade, etc.

## Correção

No arquivo `src/components/dashboard/DashboardQuickLinks.tsx`:

1. **Renomear** o link de "Achadinho Motorista" para "Painel do Motorista"
2. **Remover** a condição que oculta o link quando `affiliate_deals` está desativado
3. **Manter** apenas a condição `isDriverEnabled` (que vem do scoring model) para controlar a visibilidade

Mudança na linha 89-93:

```text
Antes:
  { label: "Achadinho Motorista", ... scoringFilter: "DRIVER" }
  + if (link.label === "Achadinho Motorista" && !achadinhosModuleEnabled) return false;

Depois:
  { label: "Painel do Motorista", ... scoringFilter: "DRIVER" }
  (sem condição extra de achadinhosModuleEnabled)
```

Isso restaura o acesso ao painel do motorista mesmo com Achadinhos desligado.

## Arquivo afetado
- `src/components/dashboard/DashboardQuickLinks.tsx` — apenas 2 linhas

