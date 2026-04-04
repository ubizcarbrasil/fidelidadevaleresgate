

## Plano: Criar Guia de Ativação da API de Mobilidade

Página dedicada com o mesmo padrão visual do Guia de Cidades (`BrandCidadesJourneyPage.tsx`), focada na ativação da integração com a API de mobilidade (TaxiMachine).

### Estrutura

**Novo arquivo: `src/pages/BrandApiJourneyPage.tsx`**

Página com timeline vertical e 7 etapas expansíveis, reutilizando o mesmo layout (Card + accordion + numbered steps + tips + navigation buttons):

| # | Fase | Ícone | Título | Rota |
|---|------|-------|--------|------|
| 1 | Conceito | `BookOpen` | O que é a integração de mobilidade? | — |
| 2 | Módulo | `Power` | Ativar o módulo de integração | `/brand-modules` |
| 3 | Cidade | `MapPin` | Selecionar a cidade para integrar | `/machine-integration` |
| 4 | Credenciais | `KeyRound` | Configurar credenciais da API | `/machine-integration` |
| 5 | Webhook | `Link2` | Registrar o webhook automático | `/machine-integration` |
| 6 | Teste | `Activity` | Testar com o Lab de Webhook | `/machine-webhook-test` |
| 7 | Validar | `CheckCircle` | Verificar corridas e pontuação | `/machine-integration` |

Cada etapa terá passos detalhados e dicas, similar ao guia de cidades.

### Alterações em arquivos existentes

1. **`src/App.tsx`**: Adicionar lazy import e rota `brand-api-journey`
2. **`src/components/consoles/BrandSidebar.tsx`**: Adicionar item "Guia da API" no grupo de integração, com ícone `BookOpen` e rota `/brand-api-journey`

### Conteúdo das etapas

**Etapa 1 — Conceito:** Explica que a integração conecta o sistema de mobilidade ao programa de fidelidade, pontuando automaticamente passageiros e motoristas a cada corrida finalizada.

**Etapa 2 — Módulo:** Acessar Configurações → Módulos e ativar "Integração Mobilidade".

**Etapa 3 — Cidade:** Na tela de Integração, selecionar a cidade onde a API será ativada.

**Etapa 4 — Credenciais:** Preencher Basic Auth (usuário/senha) e API Key fornecidos pelo sistema de mobilidade. Opcionalmente configurar credenciais Matrix para consulta de recibos.

**Etapa 5 — Webhook:** Com a API Key preenchida, o webhook é registrado automaticamente. Copiar a URL do webhook para configurar no sistema externo se necessário.

**Etapa 6 — Teste:** Usar o Lab de Webhook para simular eventos de corrida e verificar se os pontos são creditados corretamente.

**Etapa 7 — Validar:** Verificar no painel de diagnóstico se as corridas estão sendo processadas, checar o feed de eventos em tempo real e confirmar pontuação nos clientes.

