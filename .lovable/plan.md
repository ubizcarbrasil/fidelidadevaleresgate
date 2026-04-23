

# Distribuição de motoristas: destravar bloqueio + multi-seleção decente

## Diagnóstico

Dois problemas combinados na tela "Distribuir motoristas nas séries":

### 1. Bloqueador real (motivo da coluna "Disponíveis (0)" vazia)
A RPC `duelo_materialize_and_seed_season(uuid)` **existe no banco**, mas o cache do PostgREST está velho e o cliente recebe:

> `Could not find the function public.duelo_materialize_and_seed_season without parameters in the schema cache`

Por isso o botão "Distribuir motoristas agora" falha, o seeding nunca roda, nenhuma série é materializada, nenhum motorista entra na temporada → a tela abre vazia e tudo parece quebrado. Não é só UX.

### 2. UX da multi-seleção (queixa "está uma merda")
A seleção em lote existe, mas é fraca:
- Sem **"Selecionar todos os visíveis"** na coluna Disponíveis
- A barra de ação em lote **só aparece depois** de selecionar — quem nunca usou não descobre
- Move 1 motorista por vez via N chamadas RPC paralelas (lento, gera N invalidations)
- Não tem **distribuição automática equilibrada** ("repartir 60 motoristas em 5 séries balanceando")
- Em mobile, checkbox + grip + botão competem por 32px de altura — clica errado o tempo todo

## O que vou fazer

### A. Destravar a RPC (correção crítica primeiro)
1. **Migration leve** de `COMMENT ON FUNCTION duelo_materialize_and_seed_season IS '…'` + `NOTIFY pgrst, 'reload schema'` — força reload do cache do PostgREST sem alterar lógica.
2. **Fallback no front**: no `executarSeedingTemporada`, se vier o erro `PGRST202` ("function not found"), tentar 1 retry após 1.5s antes de mostrar toast de erro. Cobre casos futuros de propagação lenta de cache.
3. **Backfill via Edge Function `admin-brand-actions`** já existente: adicionar action `seedSeason` que chama a RPC com `service_role` — bypassa o PostgREST cache do client. Vira o caminho default do botão "Distribuir motoristas agora", deixando o fallback direto no client só como segundo plano.

### B. Multi-seleção decente na coluna Disponíveis

Reformular `ColunaMotoristasDisponiveis.tsx`:

1. **Header com modo seleção em lote sempre visível**: chip "Selecionar todos os visíveis (N)" / "Limpar seleção (X)" no topo, não só quando já tem alguém marcado.
2. **Checkbox grande e dedicado** num slot próprio (esquerda do card), separado do grip e do botão de ação. Touch target 32×32 mínimo.
3. **Atalho "Distribuir automaticamente"** acima da coluna: abre um popover perguntando o método:
   - **Equilibrado**: divide igualmente entre todas as séries respeitando `target_size`
   - **Por ordem alfabética → Série A primeiro até lotar, depois B, etc.**
   - **Aleatório**: shuffle e distribui equilibrado
   
   Isso resolve o caso "tenho 60 motoristas novos, quero jogar tudo de uma vez sem ficar arrastando".

### C. Mover em lote em **uma chamada só**

Hoje `moverEmLote` faz `Promise.allSettled(ids.map(mutateAsync))` — N requests, N RLS checks, N invalidations.

1. **Nova RPC** `duelo_mover_motoristas_em_lote(p_season_id uuid, p_driver_ids uuid[], p_target_tier_id uuid)` que faz todos os inserts/updates em transação única e retorna `{ moved: N, failed: [...] }`.
2. **Refatorar `useMoverMotorista`** para um hook irmão `useMoverMotoristasEmLote` que chama a nova RPC. `BarraAcoesEmLote` passa a usá-lo direto.
3. **Distribuição automática** vira uma chamada da mesma RPC, agrupada por tier de destino.

### D. Affordance da barra de ação em lote

`BarraAcoesEmLote.tsx` hoje só renderiza quando `total > 0`. Vou trocar para:
- Sempre renderizada quando há séries criadas e modo edição
- Quando `total === 0`: estado "fantasma" com texto "Selecione motoristas para mover em lote" + botão "Selecionar todos os visíveis"
- Quando `total > 0`: estado ativo atual (selector "Mover para…" + botões)

## Arquivos a alterar

- **Nova migration**: `comment + NOTIFY pgrst` + RPC `duelo_mover_motoristas_em_lote`
- `supabase/functions/admin-brand-actions/index.ts` — nova action `seedSeason`
- `src/features/campeonato_duelo/services/servico_campeonato_empreendedor.ts` — fallback retry + chamada via edge function
- `src/features/campeonato_duelo/hooks/hook_distribuicao_manual.ts` — novo `useMoverMotoristasEmLote`, `useDistribuirAutomaticamente`
- `src/features/campeonato_duelo/components/empreendedor/ColunaMotoristasDisponiveis.tsx` — header com "Selecionar todos visíveis", botão "Distribuir automaticamente"
- `src/features/campeonato_duelo/components/empreendedor/BarraAcoesEmLote.tsx` — estado fantasma sempre visível
- `src/features/campeonato_duelo/components/empreendedor/CardMotoristaArrastavel.tsx` — checkbox em slot próprio com touch target maior
- `src/features/campeonato_duelo/components/empreendedor/DistribuicaoManualView.tsx` — wiring dos novos hooks e do popover de distribuição automática
- **Novo componente**: `PopoverDistribuirAutomaticamente.tsx`

## Resultado esperado

- Botão **"Distribuir motoristas agora"** funciona na primeira tentativa (cache resolvido + edge function como caminho principal). A temporada Abril 2026 sai do estado vazio.
- Coluna "Disponíveis" passa a mostrar os 4.257 motoristas elegíveis com checkbox claro, busca e **"Selecionar todos visíveis"**.
- **"Distribuir automaticamente"** resolve o caso comum em 2 cliques: escolher método (equilibrado/alfabético/aleatório) → confirmar.
- Mover em lote vira **1 chamada de banco** em vez de N — feedback imediato.
- Barra de ação em lote sempre visível, ensina o que dá pra fazer.

## Risco e rollback

- **Risco baixo**: a RPC nova é aditiva, não toca nas existentes. O fallback via edge function não exclui o caminho atual.
- **Rollback**: descartar a nova RPC e o componente de distribuição automática; o resto continua funcionando.

