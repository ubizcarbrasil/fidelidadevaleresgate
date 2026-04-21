

## Duelos em massa + matching por perfil + sugestões inteligentes

### Objetivo
Permitir que o admin (no escopo de uma cidade) gere lotes de duelos pareando motoristas com perfis similares (volume de corridas, faixa horária, cidade), com prêmio pago pela carteira da cidade e branding "Patrocinado pelo empreendedor". Adicionar painel de sugestões de duelo no admin.

### O que muda na experiência

Na página `Gamificação` → cidade selecionada, surgem 2 novos blocos dentro da aba **Duelos**:

**1. "Sugestões de duelo (matching automático)"**
Lista de pares sugeridos calculados a partir do perfil dos motoristas habilitados. Cada linha mostra:
- Motorista A vs Motorista B
- Score de similaridade (0–100%)
- Métricas que justificam o par: corridas/30d, faixa horária dominante (manhã/tarde/noite/madrugada), tier
- Botão "Criar duelo" (cria 1) e checkbox para seleção em lote

**2. "Criar duelos em massa"**
Botão no topo da aba abre um modal:
- Preview de quantos pares qualificam
- Configuração: duração do duelo, prêmio por par, tolerância de matching (estrita/média/folgada)
- Toggle "Patrocinado pelo empreendedor" (ativa selo nos cards)
- Resumo: "X duelos × Y pts = Z pts debitados da carteira (saldo atual: W)"
- Botão "Gerar lote" → cria todos atomicamente

### Lógica de matching (cidade isolada)

Para cada motorista habilitado em `driver_duel_participants` com `duels_enabled = true`:

**Métricas calculadas dos últimos 30 dias** (de `machine_rides` com `ride_status = 'FINALIZED'`):
- `rides_30d`: total de corridas finalizadas
- `hour_bucket`: faixa horária dominante (manhã 5–12, tarde 12–18, noite 18–24, madrugada 0–5) baseada em `finalized_at`
- `tier`: `customers.customer_tier`

**Pareamento** (algoritmo guloso por similaridade):
- Mesma `branch_id` (já garantido)
- `rides_30d` dentro de ±25% (tolerância configurável)
- Mesma `hour_bucket` dominante
- Score = combinação ponderada (volume 60%, horário 30%, tier 10%)
- Cada motorista entra em no máximo 1 duelo por lote
- Exclui motoristas com duelo `live`/`accepted` em aberto

### Branding "Patrocinado pelo empreendedor"

- Novo campo em `driver_duels`: `sponsored_by_brand boolean default false`
- Quando `true`, o card do duelo (admin + motorista) exibe selo "🏆 Patrocinado pelo empreendedor"
- O prêmio continua saindo de `branch_points_wallet` (mesma mecânica do `admin_create_duel` atual), com descrição da transação marcada como "patrocinado"

### Mudanças técnicas

**Banco** (1 migration):
- `ALTER TABLE driver_duels ADD COLUMN sponsored_by_brand boolean DEFAULT false`
- RPC `get_duel_match_suggestions(p_branch_id uuid, p_volume_tolerance numeric default 0.25, p_limit int default 50)` — retorna pares sugeridos com score, métricas e justificativa
- RPC `admin_create_bulk_duels(p_branch_id, p_brand_id, p_pairs jsonb, p_start_at, p_end_at, p_prize_points_per_pair, p_sponsored boolean)` — cria N duelos atômico, debita carteira de uma vez, registra 1 transação consolidada

**Frontend** (feature isolada `src/features/duelos_matching/`):
- `pagina_duelos_matching.tsx` (componente para a aba Duelos)
- `components/lista_sugestoes_duelo.tsx` — tabela de pares sugeridos
- `components/modal_criar_duelos_lote.tsx` — modal de criação em massa
- `components/badge_patrocinado.tsx` — selo reutilizável
- `hooks/hook_sugestoes_duelo.ts` — chama `get_duel_match_suggestions`
- `hooks/hook_criar_duelos_lote.ts` — chama `admin_create_bulk_duels`
- `services/servico_duelos_matching.ts`
- `types/tipos_duelos_matching.ts`
- `utils/formatadores_matching.ts`

**Integração com telas existentes** (mínimo):
- `ListaDuelosAdmin.tsx`: exibe selo "Patrocinado" se `sponsored_by_brand = true`
- `GamificacaoAdminPage.tsx`: adiciona seção/aba para o novo painel de matching

**Edge cases tratados**:
- Cidade com menos de 2 motoristas elegíveis → mensagem clara
- Saldo insuficiente na carteira → bloqueia geração e mostra delta
- Motoristas sem `machine_rides` nos últimos 30d → caem no bucket "sem dados", listados separadamente, não pareados automaticamente
- Empate de hour_bucket: usa o segundo mais frequente como desempate

### Restrições respeitadas
- Isolamento por `branch_id` (memória `branch-scoped-enforcement`)
- Carteira da cidade como única fonte de débito (memória `city-prepaid-points-wallet`)
- `.select()` em todos os UPDATEs (memória `supabase-update-hardening`)
- Nenhuma mudança em RLS de tabelas existentes além do novo campo
- Nada toca no fluxo de motorista → 100% admin

### Critério de aceite
1. Admin abre Gamificação → cidade → aba Duelos e vê "Sugestões de duelo" com pares calculados.
2. Cada par mostra rides/30d, faixa horária e score de ambos os motoristas.
3. Botão "Criar duelos em massa" abre modal, mostra preview de N pares, valida saldo da carteira e gera todos os duelos numa transação.
4. Duelos criados aparecem em `ListaDuelosAdmin` com selo "Patrocinado pelo empreendedor".
5. Carteira da cidade é debitada uma única vez com descrição consolidada.
6. Motorista sem corridas nos últimos 30d não entra no matching automático.

### Arquivos novos
- `supabase/migrations/<timestamp>_duelos_matching_e_lote.sql`
- `src/features/duelos_matching/pagina_duelos_matching.tsx`
- `src/features/duelos_matching/components/lista_sugestoes_duelo.tsx`
- `src/features/duelos_matching/components/modal_criar_duelos_lote.tsx`
- `src/features/duelos_matching/components/badge_patrocinado.tsx`
- `src/features/duelos_matching/hooks/hook_sugestoes_duelo.ts`
- `src/features/duelos_matching/hooks/hook_criar_duelos_lote.ts`
- `src/features/duelos_matching/services/servico_duelos_matching.ts`
- `src/features/duelos_matching/types/tipos_duelos_matching.ts`
- `src/features/duelos_matching/utils/formatadores_matching.ts`

### Arquivos editados
- `src/components/admin/gamificacao/ListaDuelosAdmin.tsx` (selo)
- `src/pages/GamificacaoAdminPage.tsx` (montar novo painel)

