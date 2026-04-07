

## Reorganizar a Página de Integração em 3 Ambientes Distintos

### Problema atual
A página mistura tudo: credenciais da matriz, credenciais da cidade, pontuação do motorista, pontuação do passageiro, notificações, telegram, diagnóstico — tudo em uma lista linear. Isso confunde.

### Solução
Reorganizar a página principal com **3 abas de nível superior** (Tabs), cada uma representando uma responsabilidade distinta:

```text
┌──────────────────────────────────────────────────────────┐
│  [🏆 Pontuar Passageiro] [🚗 Pontuar Motorista] [💬 Notificações] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Conteúdo da aba selecionada                             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Aba 1 — Pontuar Passageiro
- Credenciais da **Matriz** (brand level) — já existe
- Lista de cidades conectadas com contadores de passageiros pontuados
- Painel "Últimas pontuações" (passageiros)
- Painel "Scored Customers"
- Endpoint primário (recibo vs request_v1)

### Aba 2 — Pontuar Motorista
- Seletor de cidade
- Configuração: pontuação ativada/desativada, modo (percentual/por real)
- Lista de cidades com status de pontuação do motorista
- Modo de recebimento de status: **Webhook automático** vs **URL manual** (sub-tabs para adicionar nova cidade)
- Webhook URL + diagnóstico
- Painel "Scored Drivers"
- Eventos em tempo real

### Aba 3 — Notificações
- Seletor de cidade
- Toggle de notificação no app (driver_message_enabled)
- Telegram Chat ID + teste
- Credenciais da cidade (api_key, basic_auth) — necessárias para enviar mensagem via API

### Plano de implementação

**1. Componentizar** — Extrair cada aba para componentes separados seguindo a arquitetura feature-based:
- `src/features/integracao_mobilidade/components/aba_pontuar_passageiro.tsx`
- `src/features/integracao_mobilidade/components/aba_pontuar_motorista.tsx`
- `src/features/integracao_mobilidade/components/aba_notificacoes.tsx`

**2. Refatorar `MachineIntegrationPage.tsx`** — Reduzir para uma página enxuta com 3 Tabs de nível superior, delegando conteúdo para os componentes acima.

**3. Mover lógica compartilhada** para hooks:
- `src/features/integracao_mobilidade/hooks/hook_integracoes.ts` — queries de integrations, branches, brand matrix
- `src/features/integracao_mobilidade/hooks/hook_mutacoes_integracao.ts` — mutations compartilhadas

**4. Adicionar nova cidade** — O formulário de adicionar cidade (credenciais + URL) ficará na aba "Pontuar Motorista", já que o propósito principal do cadastro de cidade é receber status de corrida.

### Arquivos
- **Criar**: `src/features/integracao_mobilidade/components/aba_pontuar_passageiro.tsx`
- **Criar**: `src/features/integracao_mobilidade/components/aba_pontuar_motorista.tsx`
- **Criar**: `src/features/integracao_mobilidade/components/aba_notificacoes.tsx`
- **Criar**: `src/features/integracao_mobilidade/hooks/hook_integracoes.ts`
- **Editar**: `src/pages/MachineIntegrationPage.tsx` — simplificar para 3 tabs

