

## Três modalidades de duelo isoladas + governança de habilitação

### Regra de negócio (definitiva)

| Modalidade | Quem banca o prêmio | Quem recebe | Motorista aposta? |
|---|---|---|---|
| **Duelo entre motoristas** | Os próprios motoristas (escrow) | Vencedor leva o pote | Sim — ambos travam pontos |
| **Duelo do empreendedor** | Carteira da cidade (`branch_points_wallet`) | Vencedor leva o prêmio | Não — risco zero |
| **Apostas paralelas (side bets)** | Apostadores externos | Vencedores da aposta | Sim — entre si, separado do duelo |

As três modalidades são **independentes** e podem ser **ligadas/desligadas separadamente** no Root e no Empreendedor.

### Governança de habilitação (chaves separadas)

Três novas flags em `branch_settings_json` (regra `=== true`, ausente = OFF):
- `enable_duel_driver_vs_driver` — duelo com aposta entre motoristas
- `enable_duel_sponsored_by_brand` — duelo patrocinado pelo empreendedor (carteira)
- `enable_duel_side_bets` — apostas paralelas entre motoristas

**Painel Root** (governança global da plataforma):
- Em `Módulos`, dentro do bloco de Gamificação, três switches independentes para o módulo `achadinhos_motorista`. O Root pode bloquear globalmente qualquer modalidade — empreendedor não consegue ativar o que o Root bloqueou.

**Painel Empreendedor** (por cidade):
- Em `Gamificação → Cidade → aba Configuração`, três switches independentes. Só aparece a opção se o Root permitir.
- Validação: empreendedor não pode ligar `sponsored_by_brand` se a cidade não tiver `branch_points_wallet` configurada.

### Mudanças de banco (1 migration)

**RPC `finalize_duel` reescrita** com bifurcação clara por origem do prêmio:
- Lê novo campo `duel_origin` em `driver_duels` (`'DRIVER_VS_DRIVER'` | `'SPONSORED'`).
- Se `SPONSORED`:
  - Vitória → credita `prize_points` ao vencedor via `points_ledger` (`reason = 'Prêmio de Duelo Patrocinado'`).
  - Empate / sem vencedor → estorna `prize_points` para `branch_points_wallet`.
  - Ignora completamente `challenger_points_bet` / `challenged_points_bet`.
- Se `DRIVER_VS_DRIVER`:
  - Mantém lógica de escrow atual (soma das apostas ao vencedor, devolução em empate).
- `settle_side_bets` continua sendo chamada nos dois casos (independente).

**Novo campo**: `ALTER TABLE driver_duels ADD COLUMN duel_origin text NOT NULL DEFAULT 'DRIVER_VS_DRIVER' CHECK (duel_origin IN ('DRIVER_VS_DRIVER','SPONSORED'))`.
- Backfill: duelos existentes com `sponsored_by_brand = true` viram `'SPONSORED'`; o resto fica `'DRIVER_VS_DRIVER'`.
- `sponsored_by_brand` continua existindo (compatibilidade visual), mas a lógica de liquidação passa a usar `duel_origin`.

**RPCs de criação ajustadas**:
- `admin_create_duel` e `admin_create_bulk_duels` → setam `duel_origin = 'SPONSORED'`, `sponsored_by_brand = true`, debitam carteira da cidade. Validam flag `enable_duel_sponsored_by_brand`.
- `propose_duel` (motorista) → setam `duel_origin = 'DRIVER_VS_DRIVER'`. Validam flag `enable_duel_driver_vs_driver`.
- Funções de side bets → validam flag `enable_duel_side_bets`.

### Mudanças de frontend

**Painel Root** (`src/pages/admin/...` — bloco de governança de módulos):
- Adicionar 3 switches isolados nas configurações globais do módulo de Gamificação.

**Painel Empreendedor** (`ConfiguracaoModulo.tsx` em `src/components/admin/gamificacao/`):
- Substituir o toggle único atual `enable_driver_duels` por 3 toggles independentes:
  - "Duelos entre motoristas (com aposta)"
  - "Duelos patrocinados pelo empreendedor (carteira da cidade paga)"
  - "Apostas paralelas em duelos"
- Cada toggle desabilitado se Root bloqueou.
- Manter compatibilidade: ao salvar, derivar `enable_driver_duels` legado como `OR` dos três para não quebrar telas antigas.

**Modais e telas de criação**:
- Modal de criação manual de duelo no admin → label **"Prêmio do empreendedor (pontos)"**, nota fixa: *"Pago pela carteira da cidade. Motoristas não apostam pontos."*
- `modal_criar_duelos_lote.tsx` → mesma nota informativa, sem mudanças estruturais.
- PWA do motorista → criação de duelo entre motoristas mantém label **"Aposta"** (porque é aposta de verdade entre eles). Telas de duelos patrocinados mostram **"Prêmio: X pts (patrocinado pelo empreendedor)"** + selo `BadgePatrocinado`.

**Listagens**:
- `ListaDuelosAdmin.tsx` → mostra coluna/badge de `duel_origin` ("Entre motoristas" | "Patrocinado").
- Cards do motorista → idem, com cor distinta para patrocinados.

### Critério de aceite
1. Root pode desligar globalmente qualquer uma das 3 modalidades; empreendedor perde acesso à opção bloqueada.
2. Empreendedor pode habilitar as 3 modalidades de forma independente por cidade.
3. Duelo criado pelo empreendedor: carteira da cidade debitada, motoristas com 0 pontos travados, vencedor recebe `prize_points` integrais, empate estorna para a carteira.
4. Duelo entre motoristas: ambos travam pontos, vencedor leva o pote (mecânica atual preservada).
5. Apostas paralelas: continuam funcionando independente das outras duas modalidades.
6. UI nunca usa "aposta" em duelos patrocinados nem "prêmio" em duelos entre motoristas — labels coerentes com a origem.
7. Liquidação respeita estritamente `duel_origin` — duelos patrocinados nunca leem `challenger_points_bet`.

### Arquivos novos
- `supabase/migrations/<timestamp>_duelos_tres_modalidades_isoladas.sql`

### Arquivos editados
- `src/components/admin/gamificacao/ConfiguracaoModulo.tsx` (3 toggles separados)
- `src/components/admin/gamificacao/ListaDuelosAdmin.tsx` (badge de origem)
- `src/features/duelos_matching/components/modal_criar_duelos_lote.tsx` (nota informativa)
- `src/features/duelos_matching/components/badge_patrocinado.tsx` (cores por origem)
- `src/features/duelos_matching/types/tipos_duelos_matching.ts` (campo `duel_origin`)
- Tela de criação manual de duelo no admin (label "Prêmio do empreendedor")
- Tela de duelo do motorista no PWA (labels condicionais por `duel_origin`)
- Painel Root de governança de módulos (3 switches globais)

### Restrições respeitadas
- `branch_points_wallet` é única fonte de débito de duelos patrocinados.
- `points_ledger` segue como fonte de verdade.
- `.select()` em todos os UPDATEs.
- Isolamento por `branch_id`.
- Sem mudança em RLS, edge functions ou bibliotecas.
- Flags em `branch_settings_json` usam `=== true` (memória `city-flag-resolution-rule`).

