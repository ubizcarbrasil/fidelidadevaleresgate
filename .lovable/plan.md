

## Cinturão Manual + Recompensa por Tomada

### Resumo
Permitir que o admin atribua manualmente o cinturão a um motorista (definindo o recorde), e configure uma recompensa em pontos para quem "tomar" o cinturão no mês (superar o recorde).

### Mudanças no Banco de Dados (1 migration)

1. **Adicionar colunas à `city_belt_champions`**:
   - `belt_prize_points integer DEFAULT 0` — recompensa em pontos para quem tomar o cinturão
   - `assigned_manually boolean DEFAULT false` — indica se foi atribuição manual

2. **Criar RPC `assign_city_belt_manual`**:
   - Parâmetros: `p_branch_id`, `p_brand_id`, `p_customer_id`, `p_record_value` (número de corridas do portador), `p_prize_points` (recompensa)
   - Faz upsert no registro `monthly` com o motorista escolhido e o recorde informado
   - Atualiza `all_time` se o valor for maior que o atual
   - Salva `belt_prize_points` e `assigned_manually = true`

3. **Atualizar RPC `update_city_belt`**:
   - Quando o cinturão muda de dono automaticamente (novo recorde superado), creditar `belt_prize_points` ao novo campeão via `points_ledger` e debitar da `branch_points_wallet`
   - Zerar o prize após distribuição

### Mudanças no Frontend

**Arquivo: `src/components/admin/gamificacao/CinturaoAdminView.tsx`**
- Adicionar botão "Atribuir Cinturão" que abre um dialog/modal
- Exibir a recompensa configurada no card do campeão mensal (ex: "🏆 Prêmio: 500 pts para quem tomar")

**Novo arquivo: `src/components/admin/gamificacao/ModalAtribuirCinturao.tsx`**
- Select de motorista (busca motoristas da cidade com `[MOTORISTA]` no nome)
- Input numérico para "Recorde do portador" (número de corridas)
- Input numérico para "Recompensa por tomada" (pontos que o próximo campeão ganha)
- Botão confirmar que chama a RPC `assign_city_belt_manual`

**Atualizar hook `hook_cinturao_cidade.ts`**:
- Incluir `belt_prize_points` e `assigned_manually` no tipo `CampeaoCinturao`

**Atualizar RPC `get_city_belt_champion`**:
- Retornar `belt_prize_points` e `assigned_manually`

### Fluxo do Usuário
```text
Gamificação → Cinturão → [Atribuir Cinturão]
→ Seleciona motorista "João Silva"
→ Recorde: 120 corridas
→ Recompensa: 500 pontos
→ [Confirmar]
→ Cinturão atribuído manualmente
→ Card exibe: "João Silva · 120 corridas · 🏆 500 pts em jogo"
→ No próximo update automático, se alguém superar 120 corridas:
   → Novo campeão recebe 500 pontos automaticamente
```

