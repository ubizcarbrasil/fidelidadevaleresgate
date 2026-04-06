
## Plano: Perfil Competitivo dos Motoristas

### Resumo
Permitir que o motorista visualize o histórico competitivo de cada adversário antes de desafiá-lo, com perfil resumido na listagem e perfil completo em tela dedicada.

---

### 1. Nova RPC no banco: `get_driver_competitive_profile`

Criar uma RPC que recebe `p_customer_id` e retorna:
- `total_duels`: total de duelos finalizados
- `wins`: vitórias
- `losses`: derrotas
- `draws`: empates
- `win_rate`: taxa de vitória (%)
- `current_streak`: sequência atual (positiva = vitórias, negativa = derrotas)
- `best_streak`: maior sequência de vitórias
- `points_won`: total de pontos ganhos em duelos
- `points_lost`: total de pontos perdidos em duelos

Calculados via query nos `driver_duels` finalizados + `points_ledger` com `reference_type IN ('DUEL_RESERVE', 'DUEL_SETTLEMENT')`.

---

### 2. Novo hook: `useDriverCompetitiveProfile`

Em `hook_duelos.ts`, adicionar hook que chama a RPC acima para um dado `customer_id`.

---

### 3. Novo componente: `PerfilCompetitivoSheet.tsx`

Tela completa (full-screen sheet) com:
- Avatar + nome/apelido + cidade
- Cards de estatísticas: duelos, vitórias, derrotas, empates, win rate
- Sequência atual + maior sequência
- Pontos ganhos vs perdidos em duelos
- Histórico recente (últimos 5 duelos com resultado)

---

### 4. Alteração em `CreateDuelSheet.tsx`

Na listagem de adversários (step "select"):
- Adicionar mini-badge com win rate e total de duelos
- Adicionar botão "Ver perfil" que abre `PerfilCompetitivoSheet`
- Manter a seleção funcional

---

### 5. Arquivos

| Arquivo | Ação |
|---------|------|
| Migração SQL (RPC `get_driver_competitive_profile`) | Criar |
| `hook_duelos.ts` | Modificar (novo hook) |
| `PerfilCompetitivoSheet.tsx` | Criar |
| `CreateDuelSheet.tsx` | Modificar (badges + botão perfil) |
