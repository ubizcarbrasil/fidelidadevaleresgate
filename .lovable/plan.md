# Etapa 5 — Aba "Tabela de Duelos"

Substituir o placeholder da aba `duelos` em `pagina_campeonato_motorista.tsx` pela listagem real dos confrontos da rodada selecionada, da série visualizada, com placar em tempo real.

## Premissas

- Reusar `CardConfronto` (já implementado, tem placar, barra de progresso, destaque de vencedor e pulso em tempo real).
- A fonte de verdade é `duelo_brackets` (filtrado por `season_id` + `tier_id` + `round`).
- Rodadas vêm da própria tabela: cada `(season_id, tier_id)` tem N rodadas distintas em `round`, ordenadas por `starts_at`. O `SubHeaderRodada` já existente passa a navegar entre essas rodadas reais (não números arbitrários).
- Sem migration nova (a tabela `duelo_brackets` já tem todos os campos). Apenas 1 RPC nova de leitura para juntar nomes/fotos.

## Blocos (na ordem de commit)

### Bloco A — RPC `driver_list_tier_round_matches`

Migration nova com:
- `driver_list_tier_round_matches(p_season_id uuid, p_tier_id uuid, p_round text) RETURNS jsonb`
- `driver_list_tier_rounds(p_season_id uuid, p_tier_id uuid) RETURNS jsonb` — retorna `[{ round, label, starts_at, ends_at, status }]` ordenado por `starts_at`.
- Ambas `SECURITY DEFINER`, validam que o motorista logado pertence ao `brand_id` da season (`driver_belongs_to_brand`).
- `driver_list_tier_round_matches` retorna `[{ id, slot, round, driver_a_id, driver_a_name, driver_a_photo_url, driver_a_rides, driver_b_id, driver_b_name, driver_b_photo_url, driver_b_rides, winner_id, starts_at, ends_at }]`.
- LEFT JOIN com `customers.photo_url` (fallback `driver_profiles.photo_url`).
- `REVOKE ... FROM PUBLIC; GRANT EXECUTE ... TO authenticated`.

### Bloco B — Camada de dados

- `services/servico_tabela_duelos.ts`: funções `listarRodadasDoTier` e `listarConfrontosDaRodada`.
- `types/tipos_tabela_duelos.ts`: `RodadaResumo` e `ConfrontoListagem` (estende `ConfrontoMataMata` com `*_photo_url`).
- `hooks/hook_tabela_duelos.ts`:
  - `useRodadasDoTier(seasonId, tierId)` — `staleTime: 60s`.
  - `useConfrontosDaRodada(seasonId, tierId, round)` — `refetchInterval: 30s`.
  - Realtime: canal `duelo:matches:{seasonId}:{tierId}` em `postgres_changes` (UPDATE em `duelo_brackets` filtrado por `tier_id`) → invalida a query da rodada.

### Bloco C — Componentes da aba

Criar em `components/motorista/`:
- `aba_tabela_duelos.tsx` — orquestra dados + estados (loading/vazio/erro) e renderiza a lista.
- `lista_confrontos_rodada.tsx` — recebe `confrontos[]` + `driverIdLogado` e renderiza `CardConfronto` para cada um, marcando `destacado` quando o motorista logado participa.
- `cabecalho_rodada.tsx` (opcional) — mostra janela da rodada (`starts_at → ends_at`) e contador "encerra em X h" abaixo do `SubHeaderRodada`.
- `vazio_sem_rodada.tsx` — estado quando não há rodada disponível na série (ex.: classificação ainda não começou).

### Bloco D — Integração na página

Em `pagina_campeonato_motorista.tsx`:
- Substituir `<PlaceholderAba>` da aba `duelos` por `<AbaTabelaDuelos seasonId tierId={serieVisualizando} driverId />`.
- Refatorar o estado `rodadaAtiva` para indexar a lista real de rodadas vinda do hook (clamp ao tamanho do array). Os botões `< >` do `SubHeaderRodada` continuam controlando o índice; o label exibe o nome amigável da rodada (ex.: "Rodada 1", "Oitavas", "Quartas").
- Adicionar `seasonId` + `tierId` ao `queryKey` invalidado pelo botão de refresh do header.

## Detalhes técnicos

- Toda query Supabase isolada por `branch_id` via RPC (que já filtra por brand do motorista).
- Toda escrita futura nesse fluxo (não há nesta etapa) usa `.select()`.
- Tema mantém `tema-campeonato` (dark verde) — somente tokens semânticos.
- Sem alterações em arquivos das Etapas 1–4 fora do necessário em `pagina_campeonato_motorista.tsx` (substituição do placeholder + binding do `SubHeaderRodada`).

## Commits

1. `feat(campeonato): RPCs driver_list_tier_rounds e driver_list_tier_round_matches`
2. `feat(campeonato): camada de dados da Tabela de Duelos (service/types/hooks)`
3. `feat(campeonato): componentes aba_tabela_duelos com CardConfronto e estados`
4. `feat(campeonato): plugar AbaTabelaDuelos na pagina_campeonato_motorista`

## Fora de escopo

- Conteúdo das demais abas (Classificação, Artilharia, Chaveamento, etc.) — Etapas 6–11.
- Filtros/ordenação na lista (entrega mínima viável só com a lista pura).
- Compartilhamento social ou deep-link de confronto.
