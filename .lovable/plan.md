

# Plano: Adicionar seção de Mensagens dentro da aba Notificações

## Objetivo

O usuário quer que o sistema de mensagens (fluxos automáticos, templates, envio manual, relatório) também seja acessível dentro da aba **Notificações**, sob uma sub-seção "Notificação via Machine". A aba "Mensagens" existente permanece intacta.

## Mudanças

### 1. Modificar `aba_notificacoes.tsx`

Adicionar uma sub-navegação interna com tabs:
- **Notificação por corrida** — conteúdo atual da aba (Telegram, mensagem no app, histórico)
- **Mensagens via Machine** — reutiliza o componente `AbaMensagens` já existente

Isso cria um acesso direto ao fluxo de mensagens sem sair do contexto de notificações.

### 2. Arquivos impactados

| Arquivo | Ação |
|---|---|
| `src/features/integracao_mobilidade/components/aba_notificacoes.tsx` | Adicionar sub-tabs internas com o conteúdo atual + `AbaMensagens` |

Nenhum arquivo novo. Apenas reorganização visual com sub-abas dentro de Notificações.

