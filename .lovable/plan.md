

## Módulo: Duelos entre Motoristas — Etapa 1

### Visão geral
Criar um sistema de duelos entre motoristas da mesma cidade, acessível pelo painel do motorista (`/driver`). O motorista pode ativar participação, desafiar outro, aceitar/recusar desafios, e acompanhar o placar em tempo real baseado em corridas concluídas.

---

### 1. Banco de dados — 2 novas tabelas + 1 função RPC

**Tabela `driver_duel_participants`**
- `id` (uuid, PK)
- `customer_id` (uuid, FK → customers.id, NOT NULL) — o motorista
- `branch_id` (uuid, FK → branches.id, NOT NULL) — cidade
- `brand_id` (uuid, FK → brands.id, NOT NULL)
- `duels_enabled` (boolean, default false)
- `public_nickname` (text, nullable)
- `avatar_url` (text, nullable)
- `created_at`, `updated_at` (timestamptz)
- UNIQUE(customer_id)

**Tabela `driver_duels`**
- `id` (uuid, PK)
- `branch_id`, `brand_id` (uuid, FK, NOT NULL)
- `challenger_id` (uuid, FK → driver_duel_participants.id)
- `challenged_id` (uuid, FK → driver_duel_participants.id)
- `start_at`, `end_at` (timestamptz, NOT NULL)
- `status` (text, NOT NULL, default 'pending') — valores: pending, accepted, declined, live, finished, canceled
- `challenger_rides_count` (int, default 0)
- `challenged_rides_count` (int, default 0)
- `winner_id` (uuid, FK → driver_duel_participants.id, nullable)
- `accepted_at`, `declined_at`, `finished_at` (timestamptz, nullable)
- `created_at`, `updated_at` (timestamptz)

**Trigger de validação de status** (em vez de CHECK constraint)

**Função RPC `count_duel_rides`** — conta corridas concluídas de um motorista dentro de uma janela de tempo e cidade:
```sql
SELECT COUNT(*) FROM machine_rides
WHERE driver_customer_id = p_customer_id
  AND branch_id = p_branch_id
  AND ride_status = 'FINALIZED'
  AND finalized_at >= p_start_at
  AND finalized_at <= p_end_at
```

**RLS**: Leitura pública (anon) filtrada por brand_id/branch_id. Escrita via security definer functions.

**Funções RPC adicionais**:
- `toggle_duel_participation(p_customer_id, p_branch_id, p_brand_id, p_enabled)` — ativa/desativa participação
- `create_duel_challenge(p_challenger_customer_id, p_challenged_customer_id, p_branch_id, p_brand_id, p_start_at, p_end_at)` — cria desafio com validações
- `respond_to_duel(p_duel_id, p_customer_id, p_accept boolean)` — aceitar ou "arregar"
- `finalize_duel(p_duel_id)` — apura vencedor contando corridas

---

### 2. Componentes React — dentro de `src/components/driver/duels/`

**`DuelsHub.tsx`** — Tela principal
- Toggle "Participar dos Duelos"
- Botão "Desafiar Motorista"
- Seções: Duelos ao Vivo, Agendados, Histórico
- Cards com nomes, placar, status, tempo restante

**`CreateDuelSheet.tsx`** — Bottom sheet para criar desafio
- Lista de motoristas da mesma cidade com `duels_enabled = true`
- Seletores de data/hora início e fim
- Resumo e confirmação

**`DuelChallengeCard.tsx`** — Card de desafio recebido
- Nome do desafiante, período
- Botões "Aceitar" e "Arregar" (tom leve/divertido)

**`DuelDetailSheet.tsx`** — Detalhe do duelo
- Nomes dos dois motoristas
- Placar atual (corridas concluídas)
- Status e tempo restante (countdown)
- Vencedor ao final

**`DuelCard.tsx`** — Card resumido para listas

---

### 3. Integração no painel do motorista

- Adicionar aba/seção "Duelos" no `DriverMarketplace.tsx` (nova tab na navegação inferior ou seção no perfil)
- Acessível apenas quando o motorista está logado e tem `branch_id` definido
- Não depende de módulo administrativo — é feature do painel público do motorista

---

### 4. Apuração de corridas

- Usar a tabela `machine_rides` existente
- Filtrar por `driver_customer_id`, `branch_id`, `ride_status = 'FINALIZED'`, `finalized_at` dentro do intervalo
- Nenhum dado sensível (rota, passageiro, valor) é exposto — apenas contagem

---

### Arquivos envolvidos
- Migration SQL (2 tabelas, trigger, 4 RPCs)
- `src/components/driver/duels/DuelsHub.tsx` (novo)
- `src/components/driver/duels/CreateDuelSheet.tsx` (novo)
- `src/components/driver/duels/DuelChallengeCard.tsx` (novo)
- `src/components/driver/duels/DuelDetailSheet.tsx` (novo)
- `src/components/driver/duels/DuelCard.tsx` (novo)
- `src/components/driver/DriverMarketplace.tsx` (adicionar navegação para Duelos)

