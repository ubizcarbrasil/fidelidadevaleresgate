

## Todos os motoristas ativos para duelo por padrão

### Problema
Atualmente, cada motorista precisa manualmente ativar a participação em duelos (opt-in). O usuário quer que todos já venham habilitados automaticamente.

### Solução

Implementar auto-enrollment: quando um motorista acessa o módulo de duelos e ainda não tem registro na tabela `driver_duel_participants`, o sistema cria automaticamente com `duels_enabled: true`.

### Alterações

**1. `src/components/driver/duels/hook_duelos.ts` — Auto-enroll no `useDuelParticipation`**

Quando o hook detecta que o motorista não tem participação (`participant === null` após query), automaticamente chama `toggle_duel_participation` com `p_enabled = true` para criar o registro. Isso acontece via `useEffect` que dispara uma vez.

```tsx
// Dentro de useDuelParticipation, após a query:
useEffect(() => {
  if (!isLoading && !participant && driver) {
    // Auto-enroll com duels_enabled = true
    supabase.rpc("toggle_duel_participation", {
      p_customer_id: driver.id,
      p_branch_id: driver.branch_id,
      p_brand_id: driver.brand_id,
      p_enabled: true,
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ["duel-participant"] });
    });
  }
}, [isLoading, participant, driver]);
```

**2. `src/components/driver/duels/DuelsHub.tsx` — Remover toggle de ativação**

Remover o switch "Participar dos Duelos" da interface, já que todos estarão ativos por padrão. Manter apenas a interface de duelos diretamente.

**3. `src/components/driver/duels/dashboard/SecaoGamificacaoDashboard.tsx` — Ajustar lógica**

Remover a checagem `participou` que condiciona a exibição. Mostrar conteúdo de duelos diretamente para todos.

### Impacto
- Motoristas novos são automaticamente habilitados ao acessar
- Motoristas existentes sem registro serão habilitados no próximo acesso
- A interface fica mais simples sem o toggle de opt-in

