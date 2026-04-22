

# Diagnóstico: por que o motorista não vê nada do Campeonato

Verifiquei o banco e o código. A temporada **"Abril 2026"** foi criada para a marca *Meu Mototáxi* na cidade alvo, mas ela está **vazia** — sem séries materializadas e sem motoristas distribuídos. Por isso o painel do motorista mostra "nenhum campeonato ativo".

## O que encontrei

**Estado atual da temporada `Abril 2026`:**
| Item | Valor |
|---|---|
| `phase` | `classification` (correto) |
| `tier_seeding_completed_at` | **NULL** — seeding nunca rodou |
| Séries materializadas (`duelo_season_tiers`) | **0** |
| Motoristas distribuídos (`duelo_tier_memberships`) | **0** |
| Standings (`duelo_season_standings`) | **0** |
| Motoristas elegíveis na marca | 4.257 |
| `engagement_format` em `brand_business_models` | **`campeonato`** ✅ |

**Causa raiz**: a função `criarTemporadaCompleta` (em `servico_campeonato_empreendedor.ts`) só faz o `INSERT` em `duelo_seasons` e grava os prêmios. **Ela não chama** a RPC `duelo_seed_initial_tier_memberships`, que é quem:
1. Cria as séries reais (`duelo_season_tiers`) a partir do `tiers_config_json`
2. Aloca os motoristas elegíveis nas séries (`duelo_tier_memberships`)
3. Cria os standings zerados
4. Marca `tier_seeding_completed_at = now()`

Sem esse passo, o motorista cai no `JOIN` vazio dentro de `driver_get_active_season` e a RPC retorna `NULL` → o painel mostra "nenhum campeonato ativo".

## O que vou ajustar

### 1. Disparar o seeding logo após criar a temporada
No `criarTemporadaCompleta`, depois do insert da temporada e dos prêmios, chamar a RPC `duelo_seed_initial_tier_memberships(p_season_id)`. Se ela falhar, mostrar mensagem clara ao empreendedor com o motivo (ex.: nenhum motorista elegível na cidade) e oferecer a opção de tentar novamente sem precisar recriar a temporada.

### 2. Botão "Distribuir motoristas agora" para temporadas órfãs
Na página `pagina_campeonato_empreendedor.tsx`, quando uma temporada estiver criada mas com `tier_seeding_completed_at IS NULL`, exibir um banner amarelo no card da temporada ativa:

> ⚠️ Temporada criada, mas os motoristas ainda não foram distribuídos nas séries. Clique em **"Distribuir motoristas agora"** para iniciar.

Isso resolve o caso da temporada de Abril/2026 que já existe **sem precisar excluí-la e recriar**.

### 3. Indicador visual no painel do motorista
No `CampeonatoMotoristaPanel`, refinar o estado vazio para diferenciar dois casos:
- **Não há temporada ativa**: mensagem atual ("Aguarde o próximo período…")
- **Há temporada mas o motorista ainda não foi distribuído**: mensagem nova ("A temporada *X* começa em breve. Você será adicionado automaticamente quando o empreendedor concluir a distribuição das séries.")

Para isso, vou criar uma RPC leve `driver_get_pending_season(p_brand_id)` que retorna apenas nome/datas da próxima temporada (sem exigir tier membership), ou ajustar `driver_get_active_season` para retornar o registro mesmo sem `tier_id`, com `driver_position = null`.

### 4. Realtime no painel do motorista
Hoje o `useTemporadaAtivaDoMotorista` tem `refetchInterval: 5min`. Vou adicionar **subscription Realtime** em `duelo_tier_memberships` filtrada por `driver_id = me`, para que assim que o seeding rodar no servidor, o painel do motorista se atualize sozinho sem precisar recarregar.

## Arquivos que serão ajustados

- `src/features/campeonato_duelo/services/servico_campeonato_empreendedor.ts`
  - após o insert em `duelo_seasons`, chamar `supabase.rpc("duelo_seed_initial_tier_memberships", { p_season_id: season.id })`
  - tratar erros do seeding sem perder a temporada criada

- `src/features/campeonato_duelo/hooks/hook_mutations_campeonato.ts`
  - novo hook `useExecutarSeedingTemporada(seasonId)` para o botão "Distribuir motoristas agora"

- `src/features/campeonato_duelo/pagina_campeonato_empreendedor.tsx`
  - banner amarelo + botão de seeding manual quando `tier_seeding_completed_at IS NULL`

- `src/features/campeonato_duelo/services/servico_campeonato_motorista.ts` + `hook_campeonato_motorista.ts`
  - melhorar mensagem do estado "temporada existe mas motorista ainda não distribuído"
  - adicionar Realtime channel em `duelo_tier_memberships`

- `src/components/driver/campeonato/CampeonatoMotoristaPanel.tsx`
  - texto de estado vazio mais informativo

### Migration nova (Supabase)
- Criar RPC `driver_get_pending_or_active_season(p_brand_id, p_driver_id)` que retorna a temporada vigente mesmo quando o motorista ainda não foi distribuído (com flag `is_pending_seeding: true`). Isso permite a UI explicar o que está acontecendo em vez de mostrar "nenhum campeonato ativo".

## O que você precisa fazer agora (resposta direta à sua pergunta)

Para a temporada **Abril 2026** que já está criada e vazia, depois que eu aplicar essas mudanças:

1. Acessar **Gamificação → Campeonato** no painel do empreendedor
2. Clicar no novo botão **"Distribuir motoristas agora"** que aparecerá no banner amarelo da temporada
3. Aguardar o seeding distribuir os motoristas elegíveis nas séries
4. A partir daí, todo motorista da cidade verá o card **"Campeonato"** na home e poderá acessar ranking, série, confronto, etc.

## Resultado esperado

- **Toda temporada nova já nasce com motoristas distribuídos**, sem passo manual.
- **Temporadas órfãs (como a atual Abril 2026)** podem ser corrigidas com um clique, sem recriar.
- O painel do motorista deixa de mostrar "nenhum campeonato ativo" quando há uma temporada em andamento — explica claramente o estado real (aguardando distribuição, em classificação, em mata-mata, etc.).
- Atualização em tempo real: assim que o seeding roda, o motorista vê o conteúdo aparecer sem refresh.

## Risco e rollback

- **Risco baixo**: o seeding é uma RPC `SECURITY DEFINER` já existente e testada no banco; apenas não estava sendo chamada pelo frontend.
- **Rollback**: remover a chamada da RPC no `criarTemporadaCompleta` e o botão manual; nada do banco é alterado destrutivamente.

