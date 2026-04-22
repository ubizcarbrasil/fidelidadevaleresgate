

# Tela de Distribuição Manual de Motoristas nas Séries

Adicionar uma tela dedicada onde o empreendedor vê **todos os motoristas da marca** e **todas as séries (A, B, C, D…)** da temporada ativa lado a lado, podendo mover qualquer motorista entre séries ou removê-lo da temporada.

## Como vai funcionar (UX)

Acessada por um novo botão **"Distribuir motoristas"** no menu **Ações** da temporada ativa (ao lado de _Incluir motorista_).

Layout em **kanban horizontal** (responsivo: vira abas em mobile):

```text
┌─────────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│ Disponíveis (n) │ Série A (n) │ Série B (n) │ Série C (n) │ Série D (n) │
├─────────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ □ João Silva    │ ☰ Pedro     │ ☰ Carlos    │ ☰ Ana       │ ☰ Marcos    │
│ □ Maria Costa   │ ☰ José      │ ☰ Lucas     │ ☰ Júlia     │ ...         │
│ □ ...           │ ...         │ ...         │ ...         │             │
│                 │  [3/16]     │  [5/16]     │  [2/8]      │  [1/8]      │
└─────────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
   [Ações em lote]   ↑ contador  ↑ contador    ↑ contador    ↑ contador
                       atual/máx
```

### Interações principais

- **Drag & drop**: arrastar motorista entre colunas (incluindo coluna "Disponíveis" para tirar da temporada).
- **Mobile/touch**: cada cartão tem botão `Mover para…` que abre um pequeno popover com a lista de séries.
- **Seleção múltipla** na coluna "Disponíveis": checkboxes + botão **"Mover X selecionados para Série [A/B/C/D]"** (ação em lote).
- **Busca** no topo da coluna "Disponíveis" (filtra por nome/telefone).
- **Indicador de capacidade** em cada série: `[3/16]` em verde, `[16/16]` em amarelo, `[17/16]` em vermelho com aviso "Acima do tamanho configurado — permitido, mas será refletido no chaveamento".
- **Estado de origem**: badge `Manual` aparece em quem foi adicionado/movido manualmente; `Seed` em quem veio do seeding inicial.

### Confirmações e bloqueios

- Mover motorista → confirma silenciosamente, mostra toast `Motorista movido para Série B`.
- Remover (jogar na coluna Disponíveis) → `AlertDialog`: _"Remover João da temporada? Os pontos acumulados serão perdidos."_
- Bloqueios duros (mensagem clara):
  - Temporada **finalizada** ou **cancelada** → tela em modo somente-leitura.
  - Temporada já em **fase mata-mata** → bloqueia mover/remover de quem já está em chave.

## Arquitetura (técnica)

### 1. Backend — 2 RPCs novas (`SECURITY DEFINER`)

Migration nova: `supabase/migrations/<timestamp>_distribuicao_manual_series.sql`

#### `duelo_move_driver_to_tier(p_season_id, p_driver_id, p_target_tier_id, p_reason)`
- Valida `duelo_admin_can_manage(brand_id)` da temporada.
- Bloqueia se temporada não está em fase **classification**.
- Faz `UPDATE duelo_tier_memberships SET tier_id = p_target_tier_id, source = 'manual_move' WHERE season_id AND driver_id` — com `.select()` defensivo.
- Loga em `duelo_driver_tier_history` (outcome `'manual_moved'`).
- Atualiza `duelo_season_standings.tier_id` correspondente.

#### `duelo_remove_driver_from_season(p_season_id, p_driver_id, p_reason)`
- Mesmas validações.
- Bloqueia se motorista já tem partida no `duelo_brackets`.
- `DELETE FROM duelo_tier_memberships`, `DELETE FROM duelo_season_standings`.
- Loga em `duelo_driver_tier_history` (outcome `'manual_removed'`).

Ambas com `GRANT EXECUTE ... TO authenticated` e `REVOKE FROM public`.

### 2. Frontend — nova feature interna

```text
src/features/campeonato_duelo/
├── components/empreendedor/
│   ├── DistribuicaoManualView.tsx        ← container principal (Dialog full-screen)
│   ├── ColunaMotoristasDisponiveis.tsx   ← coluna esquerda + busca + checkboxes
│   ├── ColunaSerie.tsx                   ← coluna por série + contador
│   ├── CardMotoristaArrastavel.tsx       ← card com dnd + popover "mover para"
│   ├── BarraAcoesEmLote.tsx              ← botão "mover X selecionados"
│   └── ConfirmRemoverMotorista.tsx       ← AlertDialog de confirmação
├── hooks/
│   └── hook_distribuicao_manual.ts       ← mutations: useMoverMotorista, useRemoverMotorista
├── services/  (estende o existente)
│   └── servico_campeonato_empreendedor.ts ← +2 funções RPC
└── types/    (estende)
    └── tipos_empreendedor.ts             ← +2 inputs
```

### 3. Pontos de integração

- **`AcoesTemporadaAtiva.tsx`**: adicionar item `Distribuir motoristas` no dropdown (ícone `Users`).
- **`pagina_campeonato_empreendedor.tsx`**: estado `modalDistribuir` + render do `DistribuicaoManualView` (full-screen Dialog para aproveitar o espaço).
- **`servico_campeonato_empreendedor.ts`**: + `moverMotoristaParaSerie(input)` e `removerMotoristaDaSeason(input)`.
- **Invalidações**: ao mover/remover, invalidar `empreendedor-dashboard-campeonato`, `empreendedor-series-detail`, `empreendedor-drivers-available`.

### 4. Drag & drop

Usar **`@dnd-kit/core` + `@dnd-kit/sortable`** (leve, acessível, suporta touch). Se não estiver instalado, adicionar como dep.

Fallback sem DnD em telas <768px: cards mostram botão `Mover para ▾` direto.

## Resultado esperado

- Empreendedor abre temporada → menu Ações → "Distribuir motoristas" → vê tudo em uma tela só.
- Pode arrastar 1 a 1, ou selecionar vários na coluna "Disponíveis" e jogar em massa numa série.
- Pode tirar motorista da temporada arrastando pra "Disponíveis" (com confirmação).
- Tudo respeita as regras de fase (só funciona durante **classification**) e isolamento por marca.

## Risco e rollback

- **Risco baixo**: as duas RPCs novas são aditivas; nenhuma estrutura existente muda.
- Tela nova vive em modal — não afeta navegação atual.
- **Rollback**: down trivial dropando as duas funções; remover o item do dropdown e os arquivos novos.

