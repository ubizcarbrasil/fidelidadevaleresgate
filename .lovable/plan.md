

# Atualizar Manuais com Novas Funcionalidades

## Resumo
Os manuais (`dados_manuais.ts`) e a ajuda contextual (`helpContent.ts`) estão desatualizados em relação a várias funcionalidades recentes. Este plano cobre todas as lacunas identificadas.

## Lacunas Identificadas

1. **Minhas Cidades (brand-branches)** — Nenhum manual existe. Botões "Resetar pontos" e "Editar" foram adicionados recentemente com labels visíveis. Reset granular (todos, motoristas, clientes, individual) + histórico de auditoria. Reset também disponível dentro da tela de edição.

2. **Comunicação (send-notification)** — Nenhum manual existe em `dados_manuais.ts`. A página agora tem duas abas: "Notificação Push" e "Mensagens via Machine" (templates, fluxos automáticos, envio manual, relatório).

3. **Apostas Laterais (Side Bets)** — Funcionalidade completa de apostas em duelos não é mencionada nos manuais de gamificação. Inclui criação, aceitação, ranking de apostadores.

4. **Integração Mobilidade** — Manual genérico, não reflete a arquitetura atual de 3 ambientes (Pontuar Passageiro, Pontuar Motorista, Notificações/Mensagens).

5. **Ajuda Contextual (`helpContent.ts`)** — Rota `/send-notification` desatualizada (só push), rota `/brand-branches` inexistente.

## Mudanças

### 1. `src/components/manuais/dados_manuais.ts`

**A) Adicionar manual "Minhas Cidades"** na categoria "Personalização & Vitrine":
- Título: "Minhas Cidades"
- Cobertura: listar cidades, ativar/desativar, botão "Resetar pontos" (granular: todos, motoristas, clientes, específico), botão "Editar", histórico de resets, reset também acessível na tela de edição
- Rota: `/brand-branches`

**B) Adicionar manual "Comunicação"** — Nova categoria ou dentro de uma existente:
- Manual 1: "Notificação Push" — enviar push para clientes (todos ou por cidade)
- Manual 2: "Mensagens via Machine" — templates com variáveis, fluxos automáticos (eventos de gamificação, apostas), envio manual (massa ou individual), relatório de entregas
- Rota: `/send-notification`

**C) Adicionar manual "Apostas Laterais"** na categoria "Gamificação — Administração":
- Cobertura: criar apostas em duelos, aceitar, ranking de apostadores, configuração de templates de mensagem para SIDE_BET_CREATED e SIDE_BET_ACCEPTED
- Rota: `/gamificacao-admin`

**D) Atualizar manual "Integração Mobilidade"** (id: `integracao-mobilidade`):
- Refletir os 3 ambientes: Pontuar Passageiro (Logs + Matrix), Pontuar Motorista (Webhook automático/manual, diagnósticos), Notificações (Chat app + Telegram + fallback)
- Mencionar credenciais centralizadas no nível da Marca

**E) Adicionar manuais na seção franqueado** (`gruposManuaisFranqueado`):
- Manual de Apostas Laterais para o franqueado (aba Apostas na gamificação)

### 2. `src/lib/helpContent.ts`

**A) Atualizar `/send-notification`:**
- Adicionar seção sobre a aba "Mensagens via Machine" (templates, fluxos, envio, relatório)
- Manter seção existente de Push

**B) Adicionar `/brand-branches`:**
- Seção: gerenciar cidades da marca, ativar/desativar, resetar pontos, editar

**C) Atualizar `/gamificacao-admin`:**
- Adicionar seção sobre Apostas Laterais

## Detalhes Técnicos

- Todos os novos manuais seguem a interface `ManualEntry` existente (id, titulo, descricao, comoAtivar, passos, dicas, rota)
- Ajuda contextual segue a interface `HelpEntry` existente (pageTitle, sections com title, summary, steps, tips)
- Nenhum novo arquivo criado — apenas edição dos dois arquivos existentes
- Nenhuma mudança de lógica ou componentes — apenas conteúdo textual

