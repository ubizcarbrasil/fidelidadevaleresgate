
## Diagnóstico — porque o cupom criado não aparece

Confirmei consultando o banco em tempo real:

- A loja do usuário (Verde Vegan, `store_id: 41dd3149...`) tem **2 cupons** salvos no banco:
  - `Prato executivo R$24,90` — criado às `00:09:17` (esse aparece na tela)
  - `CRÉDITO DE R$ 20.00` — criado às `00:31:47` (**esse não aparece**)
- O INSERT funcionou: `status=ACTIVE`, `is_active=true`.
- A última requisição GET de cupons foi às `00:28:35` — antes da criação. **Nenhum refetch ocorreu após o INSERT**.

### Causa raiz

O `queryClient` global (`src/lib/queryClient.ts`) está configurado com:
```ts
staleTime: 5 * 60 * 1000   // 5 min
refetchOnMount: false       // nunca refetch ao montar
```

Quando o usuário fecha o Wizard:
1. `setShowWizard(false)` é chamado → `StoreCouponsTab` vai remontar.
2. `qc.invalidateQueries({ queryKey: ["store-offers", store.id] })` é chamado no mesmo tick.
3. Como o `StoreCouponsTab` ainda **não está montado** (re-render acontece após o callback), não há query ativa → o invalidate apenas **marca como stale**, sem disparar refetch.
4. Na remontagem, `useQuery` lê o cache existente. Por causa de `refetchOnMount: false`, **não refetcha mesmo estando stale**.
5. Resultado: a lista exibe dados antigos até um hard reload (F5).

Esse mesmo padrão afeta outras telas com fluxo Wizard → fechar → listar (cidades, vouchers admin, ofertas, etc.).

## Correção proposta

### 1. Ajustar config global do React Query (`src/lib/queryClient.ts`)
Trocar `refetchOnMount: false` por `refetchOnMount: "always"` apenas quando a query estiver stale. Comportamento padrão do React Query (`true`) já é "refetch ao montar se stale" — basta remover a linha que força `false`.

```ts
// ANTES
refetchOnMount: false,

// DEPOIS
// remove a linha; deixa o padrão `true` (refetch only-if-stale)
```

Mantemos `staleTime: 5 min` e `refetchOnWindowFocus: false` (evita refetch agressivo em foco), mas garantimos que **após invalidação, qualquer tela que monte refetcha**.

### 2. Garantir await + sequencing correto no `StoreVoucherWizard`
No `handleSubmit` do `StoreVoucherWizard.tsx`, após sucesso, invalidar a query **antes** de fechar o wizard, e usar `await` para garantir refetch:

```ts
} else {
  toast.success("Cupom criado com sucesso!");
  await queryClient.invalidateQueries({ queryKey: ["store-offers", storeId] });
  await queryClient.invalidateQueries({ queryKey: ["store-offers-recent", storeId] });
  await queryClient.invalidateQueries({ queryKey: ["store-dashboard-stats", storeId] });
  onClose();
}
```

Isso elimina a corrida (close → unmount → invalidate → remount com cache antigo).

### 3. Limpar o `onClose` no `StoreOwnerPanel.tsx`
O invalidate redundante no callback do parent fica como fallback, mas o trabalho real passa a ocorrer no wizard com `await`.

## Arquivos editados

- `src/lib/queryClient.ts` — remover `refetchOnMount: false`.
- `src/components/store-voucher-wizard/StoreVoucherWizard.tsx` — invalidar com `await` antes de `onClose()`; importar `useQueryClient`.
- `src/pages/StoreOwnerPanel.tsx` — manter invalidate no `onClose` como salvaguarda (sem mudanças funcionais relevantes).

## Resultado esperado

- Após salvar um cupom, a lista atualiza imediatamente exibindo o novo registro, sem necessidade de F5.
- Mesma melhoria automática para qualquer outro fluxo do app que dependa de `invalidateQueries` após mutation (cidades, ofertas, tenants, etc.).
- Sem impacto negativo de performance: o refetch só ocorre quando a query está realmente stale (>5 min) ou foi invalidada explicitamente.
