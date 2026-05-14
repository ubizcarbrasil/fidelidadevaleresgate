## Etapa 4 — Artilharia / Recordes (modelo multi-prêmio)

Decisão confirmada: migrar `campeonato_artilharia_window_prizes` para suportar **múltiplos prêmios por janela** (1º/2º/3º…). Reescrever admin + motorista.

---

### Commit A — Migration multi-prêmio

Arquivo novo em `supabase/migrations/`:

- `ALTER TABLE campeonato_artilharia_window_prizes`:
  - `ADD COLUMN IF NOT EXISTS position int NOT NULL DEFAULT 1`
  - `ADD COLUMN IF NOT EXISTS prize_kind text` (`points` | `item`)
  - `ADD COLUMN IF NOT EXISTS prize_value text` (string p/ aceitar número ou texto)
  - `ADD COLUMN IF NOT EXISTS description text`
  - CHECK `position BETWEEN 1 AND 50`
  - CHECK `prize_kind IN ('points','item')` (nullable p/ linhas legadas)
- Drop unique antigo `(season_id, window_key)` → recriar como `(season_id, window_key, position)`.
- Backfill: linhas legadas ficam `position=1`, mantém `enabled`/`label` (label vira fallback de `description` na leitura).
- Index `(season_id, window_key, position)`.
- RLS já cobre via policies existentes (`admin_can_manage` + driver brand/branch). Sem alteração.

Sem mudanças em RPCs.

### Commit B — Admin: `EditorPremiosArtilharia.tsx`

Novo componente em `components/empreendedor/EditorPremiosArtilharia.tsx`. Substitui `SecaoPremiosArtilharia` no painel (deletar uso antigo no `pagina_campeonato_empreendedor`).

- 4 cards (24h / 7 dias / 15 dias / 30 dias), cada um com lista de prêmios:
  - Linha = `Posição` (input num) | `Tipo` (Select pontos/item) | `Valor` (input) | `Descrição` (input) | botão `×`.
  - Botão `+ Adicionar prêmio` por janela.
- Salvar por janela: `delete WHERE season_id+window_key` → `insert` lista atual; ambos com `.select()` (Update Hardening). Toast PT-BR de sucesso/erro RLS.
- Mantém `SecaoPremiosArtilharia.test.tsx` ajustado ao novo schema (ou removido se não cobrir mais o fluxo).

### Commit C — Motorista: `AbaArtilharia` com badge multi-prêmio

`components/motorista/AbaArtilharia.tsx` já tem 4 abas, medalhas, separador, fila top-20 e badge `has_prize`. Ajustes mínimos:

- Hook novo `useArtilhariaPremios(seasonId, window)` lendo as N linhas (ordenadas por `position`) → tooltip/modal com lista completa quando o usuário toca no badge 🎁.
- Badge mostra `prize_label` legado se `position=1.description` vazio; senão usa `description`.
- Manter skeletons / vazio / erro+retry já existentes.

### Commit D — Inscrição: prêmios na `AbaProximosCampeonatos`

Em cada card de temporada futura, adicionar `<Collapsible>` "Ver prêmios de Artilharia":

- Query: `select * from campeonato_artilharia_window_prizes where season_id=:id order by window_key, position`.
- Render compacto: `[24h] 1º — 500 pts • 2º — Vale R$ 100 …` agrupado por janela.
- Vazio: `"Sem prêmios extras de artilharia"`.
- `branch_id` já está implícito via RLS (season pertence ao branch correto).

---

### Regras transversais
- Tokens semânticos apenas (sem cor hardcoded).
- Toda escrita com `.select()`.
- `tsc --noEmit` verde após cada commit, na ordem A → B → C → D.
- Nenhuma mudança fora de `src/products/campeonato/` exceto a migration.
- RPC `driver_get_top_riders` permanece intocada (continua devolvendo `has_prize`/`prize_label` baseado em `position=1`).

### Riscos
- `driver_get_top_riders` hoje provavelmente lê `enabled`/`label`. Se quebrar com a nova UNIQUE, ajusto a query do RPC dentro da migration A para olhar `position=1` (sem mudar assinatura). Confirmo ao abrir o arquivo durante a execução.
