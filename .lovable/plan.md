
## Plano: Avaliação entre Motoristas após Duelo

### 1. Migração SQL

**Nova tabela `driver_duel_ratings`:**
- `duel_id`, `rater_customer_id`, `rated_customer_id`
- `rating` (1-5), `tags` (text[]), `comment` (text, opcional)
- Unique constraint: (duel_id, rater_customer_id) — avalia apenas uma vez
- RLS: motorista só pode inserir avaliação se participou do duelo e o duelo está `finished`

**Nova RPC `get_driver_reputation`:**
- Recebe `p_customer_id`, retorna `avg_rating`, `total_ratings`, `tags_summary` (tags mais frequentes)

### 2. Hook `useAvaliacaoDuelo`

- `useSubmitRating`: mutation para inserir avaliação
- `useDuelRating`: query para verificar se já avaliou
- `useDriverReputation`: query para buscar reputação de um motorista

### 3. Componente `AvaliacaoDueloSheet.tsx`

Sheet com:
- Estrelas 1-5 (toque para selecionar)
- Tags rápidas como chips selecionáveis (competitivo, respeitoso, bom adversário, foi pra cima, pediu revanche, pontual)
- Campo de comentário curto opcional (max 200 chars)
- Botão "Enviar Avaliação"

### 4. Integração

- No card de duelo finalizado (`DuelFinishedCard` ou similar), adicionar botão "Avaliar adversário" que abre o sheet
- Mostrar badge "Já avaliado ✓" se já avaliou
- Integrar reputação no `PerfilCompetitivoSheet` existente

### Arquivos

| Arquivo | Ação |
|---------|------|
| Migração SQL (tabela + RPC) | Criar |
| `hook_avaliacao_duelo.ts` | Criar |
| `AvaliacaoDueloSheet.tsx` | Criar |
| `DuelCardActions` ou card de duelo finalizado | Modificar |
| `PerfilCompetitivoSheet.tsx` | Modificar (adicionar reputação) |
