

## Etapa 6 — Painel Administrativo do Módulo de Gamificação

### Resumo
Criar uma página administrativa completa para gerenciar o módulo de Duelos/Ranking/Cinturão no console Branch. Inclui configuração avançada, visualização de duelos, ranking, cinturão, moderação de apelidos e estatísticas. Rota `/gamificacao-admin` no BranchSidebar.

---

### 1. Banco de dados — Novas colunas em `branch_settings_json`

Nenhuma tabela nova. Expandir o JSON existente com campos adicionais:

```json
{
  "enable_driver_duels": true,
  "enable_city_ranking": true,
  "enable_city_belt": true,
  "allow_public_duel_viewing": true,
  "duel_min_duration_hours": 24,
  "duel_max_duration_hours": 168,
  "duel_max_simultaneous": 3,
  "ranking_metric": "rides",
  "belt_metric": "rides",
  "decline_phrases": ["Hoje não, parceiro! 😅", "Tô de boa por agora 🙏", "Quem sabe na próxima? 😂"]
}
```

---

### 2. Nova rota e página

**`src/pages/GamificacaoAdminPage.tsx`**
- Página wrapper que carrega dados do branch atual e renderiza os sub-componentes
- Usa `useBrandGuard` para obter `currentBranchId`

**Rota**: `/gamificacao-admin` no `App.tsx`, sem ModuleGuard (a própria página valida)

---

### 3. Componentes do painel (dentro de `src/components/admin/gamificacao/`)

**`ConfiguracaoModulo.tsx`** — Card com todos os toggles e campos:
- Toggles: duelos, ranking, cinturão, visualização pública
- Campos numéricos: duração mín/máx dos duelos (horas), máx duelos simultâneos
- Selects: métrica do ranking, métrica do cinturão (inicialmente "rides")
- Editor de frases de recusa (lista editável com add/remove)
- Botão salvar que atualiza `branch_settings_json`

**`ListaDuelosAdmin.tsx`** — Tabela com todos os duelos da cidade:
- Colunas: desafiante, desafiado, status, período, corridas, vencedor
- Filtros por status (pendente, ao vivo, encerrado, etc.)
- Usa query em `driver_duels` filtrado por `branch_id`

**`EstatisticasGamificacao.tsx`** — Cards de KPIs:
- Total de duelos, duelos ativos, participantes habilitados, taxa de aceite
- Total de corridas no mês (via ranking RPC)
- Campeão atual do cinturão

**`RankingAdminView.tsx`** — Visualização do ranking top 10:
- Reutiliza `useRankingCidade` do hook existente
- Botão "Resetar ranking mensal" (chama delete/update se necessário)

**`CinturaoAdminView.tsx`** — Visualização do cinturão:
- Reutiliza `useCinturaoCidade` do hook existente
- Mostra campeão atual, recorde, tipo
- Botão "Atualizar cinturão" que chama RPC `update_city_belt`

**`ModeracaoApelidos.tsx`** — Tabela de participantes:
- Lista `driver_duel_participants` da cidade
- Colunas: nome real (via customers), apelido público, avatar, duelos habilitado
- Botão inline para editar apelido (update direto no campo `public_nickname`)

---

### 4. Integração no sidebar

**`src/components/consoles/BranchSidebar.tsx`** (modificado)
- Adicionar grupo "Gamificação" com `scoringFilter: "DRIVER"`:
  ```ts
  {
    label: "Gamificação",
    scoringFilter: "DRIVER",
    items: [
      { key: "sidebar.gamificacao", defaultTitle: "Duelos & Ranking", url: "/gamificacao-admin", icon: Swords, moduleKey: "achadinhos_motorista" },
    ],
  }
  ```

**`src/App.tsx`** (modificado)
- Adicionar rota: `<Route path="gamificacao-admin" element={<GamificacaoAdminPage />} />`

---

### 5. Estrutura de arquivos

```
src/pages/GamificacaoAdminPage.tsx (novo)
src/components/admin/gamificacao/ConfiguracaoModulo.tsx (novo)
src/components/admin/gamificacao/ListaDuelosAdmin.tsx (novo)
src/components/admin/gamificacao/EstatisticasGamificacao.tsx (novo)
src/components/admin/gamificacao/RankingAdminView.tsx (novo)
src/components/admin/gamificacao/CinturaoAdminView.tsx (novo)
src/components/admin/gamificacao/ModeracaoApelidos.tsx (novo)
src/components/consoles/BranchSidebar.tsx (modificado)
src/App.tsx (modificado)
```

### 6. Layout da página

A página usará um layout tabulado (Tabs) com 5 abas:
1. **Configuração** — ConfiguracaoModulo
2. **Duelos** — ListaDuelosAdmin
3. **Ranking** — RankingAdminView
4. **Cinturão** — CinturaoAdminView
5. **Moderação** — ModeracaoApelidos

Header com EstatisticasGamificacao (KPI cards) visível em todas as abas.

