
## Relatório de Auditoria Completa do Projeto

---

### RESUMO EXECUTIVO

O projeto está em excelente estado de saúde. Build limpo sem erros, TypeScript sem falhas de tipo, imports todos resolvidos, rotas corretamente configuradas. A maior parte do sistema está funcional e bem arquitetada.

Encontrei **1 bug crítico de lógica**, **0 telas quebradas**, e **itens de melhoria de segurança no banco**.

---

### ✅ O QUE ESTÁ FUNCIONANDO CORRETAMENTE

**Build e Compilação**
- Zero erros TypeScript (`tsc --noEmit` limpo)
- Zero warnings no dev server (Vite 5 rodando limpo)
- Todos os lazy imports resolvem corretamente
- Nenhum import quebrado detectado

**Estrutura e Rotas (App.tsx)**
- 80+ rotas registradas com guards corretos (ModuleGuard, RootGuard, ProtectedRoute)
- Navegação por consoles (ROOT, BRAND, BRANCH) funcionando
- Rotas públicas (/auth, /trial, /landing, /driver, /register-store) acessíveis sem login
- White-label routing funcionando (AppContent detecta isWhiteLabel corretamente)
- Partner landing, driver panel e customer preview como rotas independentes

**Módulo de Gamificação / Duelos**
- DuelsHub com toggle de participação, criação de desafios, aceite/recusa
- Placar ao vivo com countdown no DuelDetailSheet
- Ranking da cidade via RPC `get_city_driver_ranking`
- Cinturão da cidade via RPC `update_city_belt` + `get_city_belt_champion`
- Vitrine pública com refresh a cada 30s (SecaoDuelosCidade)
- Admin completo: ConfiguracaoModulo, ListaDuelosAdmin, RankingAdminView, CinturaoAdminView, ModeracaoApelidos
- EventBus com 17 eventos registrados e bridge de invalidação de cache
- Serviço de notificações via edge function
- Manual de ajuda (AjudaDuelosSheet) integrado no header
- Escalabilidade futura preparada (tipos, tabelas, feature flags)

**Autenticação**
- AuthContext com bootstrap robusto (timeout de 5s de segurança)
- Roles carregadas via `user_roles` com fetchIdRef anti-race-condition
- Boot error boundary com overlay de erro

**Banco de Dados**
- RLS ativo em todas as tabelas do módulo de gamificação
- Tabelas competitivas (duels, rankings, belt, achievements, feed) com SELECT público (correto para dados de competição)
- Todas as escritas via RPCs com SECURITY DEFINER
- Triggers de validação para status de duelo, temporada e cinturão

---

### 🔴 BUG CRÍTICO ENCONTRADO

**Notificações de vitória/derrota enviadas para pessoa errada**

Arquivo: `src/components/driver/duels/hook_duelos.ts`, linhas 268-280

O RPC `finalize_duel` retorna `winner_id` como **participant ID** (da tabela `driver_duel_participants.id`). Porém o código de notificação compara `result.winner_id` com `result.challengerCustomerId` (que é um **customer ID** da tabela `customers.id`).

Esses IDs são **diferentes** — nunca vão coincidir. Resultado: as notificações DUEL_VICTORY e DUEL_DEFEAT são atribuídas incorretamente.

**Impacto**: Motorista que venceu recebe notificação de derrota e vice-versa.

**Correção necessária**: Comparar `result.winner_id` com os IDs de **participante** (challenger_id/challenged_id do duelo), não com customer IDs. Ou: o RPC `finalize_duel` poderia retornar o `winner_customer_id` diretamente.

O mesmo bug afeta o `DuelDetailSheet.tsx` (linhas 95-101 e 113-119), mas ali funciona corretamente porque `duel.winner_id` é comparado com `duel.challenger_id` e `duel.challenged_id` — que **são** participant IDs. Logo a UI do placar está certa, mas as notificações estão erradas.

---

### 🟡 MELHORIAS RECOMENDADAS

**1. Linter de RLS — 16 warnings de "Always True"**

O linter do banco detectou 16 políticas RLS permissivas (USING true ou WITH CHECK true) em operações INSERT/UPDATE/DELETE. As tabelas de gamificação estão corretas (SELECT-only público), mas há outras tabelas no sistema com políticas muito abertas. Recomendo revisar caso a caso.

**2. Leaked Password Protection desabilitada**

O linter detectou que a proteção contra senhas vazadas está desativada. Recomenda-se habilitar via configurações de autenticação.

**3. PWABanners fora do BrowserRouter**

Em `App.tsx` (linha 317), o componente `PWABanners` está renderizado **fora** do `BrowserRouter`. Isso funciona hoje porque `usePWA` não usa navegação, mas é um risco futuro. Se o hook usasse `useNavigate`, quebraria.

**4. Ausência de INSERT policies nas tabelas de escalabilidade**

As tabelas `gamification_seasons`, `driver_achievements` e `city_feed_events` têm apenas SELECT policy. Quando funcionalidades futuras precisarem inserir dados via cliente (não RPC), serão necessárias INSERT policies. Atualmente está OK pois tudo vai por SECURITY DEFINER.

---

### ✅ ITENS VERIFICADOS SEM PROBLEMAS

| Área | Status |
|---|---|
| TypeScript types | ✅ Zero erros |
| Lazy imports | ✅ Todos resolvem |
| Dev server | ✅ Limpo, sem warnings |
| Rotas protegidas | ✅ Guards corretos |
| EventBus bridge | ✅ Todas as invalidações mapeadas |
| Serviço de notificações | ✅ Mapeamento completo dos 10 eventos |
| Manual/Ajuda | ✅ Integrado no DuelsHub e dados_manuais |
| Config duelos (feature flags) | ✅ 12 flags com defaults seguros |
| Hook de conquistas (stub) | ✅ Preparado para uso futuro |
| Feed competitivo (stub) | ✅ Preparado para uso futuro |
| Admin gamificação | ✅ 6 componentes funcionais |

---

### PLANO DE CORREÇÃO

**Passo 1 — Corrigir bug de winner_id nas notificações**

Em `hook_duelos.ts`, no `onSuccess` de `useFinalizeDuel`, trocar a comparação:

```ts
// ANTES (bugado):
const winnerId = result.winner_id === result.challengerCustomerId ? ...

// DEPOIS (correto):
// Precisamos dos participant IDs do duelo, não dos customer IDs
// O winner_id retornado pela RPC é um participant_id (driver_duel_participants.id)
// Devemos mapear participant_id → customer_id para as notificações
```

Será necessário também passar `challengerParticipantId` e `challengedParticipantId` nos parâmetros de `finalize()`, e usar esses para a comparação com `result.winner_id`.

---

### DECISÕES PENDENTES (não corrigíveis sem orientação)

1. **Políticas RLS permissivas em outras tabelas**: Requer auditoria individual de cada tabela — me avise se quiser que eu faça isso separadamente.
2. **Proteção contra senhas vazadas**: Requer mudança na configuração de autenticação do backend.
