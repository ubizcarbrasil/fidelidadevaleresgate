
## Diagnóstico
- Revisei o fluxo da renovação manual em `src/pages/Brands.tsx`, a action `renew_subscription` em `supabase/functions/admin-brand-actions/index.ts` e a lógica do bloqueio em `src/components/TrialExpiredBlocker.tsx`.
- O backend já renovou a marca corretamente: `Ubiz Resgata` está com `subscription_status = TRIAL`, `subscription_plan = profissional` e `trial_expires_at` em **2027-04-14**.
- Então o problema não é mais a renovação em si. O que está falhando é a **atualização da interface**.
- Hoje o bloqueio e o banner usam React Query com cache padrão de 30s e sem atualização agressiva. Se a tela já estava aberta, ela pode continuar mostrando o valor antigo de 2026.
- A invalidação do cache hoje acontece no checkout da página `/subscription`, mas **não acontece na renovação manual pelo painel root**. Além disso, o bloqueio não faz refetch frequente para refletir uma reativação feita em outra aba/dispositivo.

## Plano
1. **Corrigir a atualização do bloqueio**
   - Ajustar `src/components/TrialExpiredBlocker.tsx` para não depender de cache antigo.
   - Forçar refetch ao montar a tela, ao voltar foco e com atualização periódica leve enquanto a marca estiver em `TRIAL` ou `EXPIRED`.

2. **Corrigir o banner de trial**
   - Aplicar a mesma lógica em `src/components/TrialBanner.tsx`, para ele refletir o status novo sem atraso.

3. **Invalidar as queries certas após renovar**
   - Em `src/pages/Brands.tsx`, depois de `renew_subscription`, invalidar também:
     - `["brand-trial-blocker", brandId]`
     - `["brand-trial-status", brandId]`
     - além da lista `["brands"]`

4. **Melhorar o feedback operacional**
   - No retorno da renovação, mostrar no toast o status aplicado e, se for `TRIAL`, a nova validade, para deixar claro que a ação realmente foi salva.

## Arquivos a ajustar
- `src/components/TrialExpiredBlocker.tsx`
- `src/components/TrialBanner.tsx`
- `src/pages/Brands.tsx`

## Resultado esperado
- A Ubiz Resgata vai sair do bloqueio de “Período gratuito encerrado”.
- A renovação manual feita no painel root passará a aparecer quase imediatamente na interface.
- Abas/dispositivos já abertos deixarão de ficar presos no valor antigo do cache.

## Detalhe técnico
```text
Hoje:
renovação salva no banco -> query antiga continua em cache -> blocker mostra vencimento antigo

Depois:
renovação salva -> invalidation + refetch no blocker/banner -> UI lê 2027 -> bloqueio some
```
