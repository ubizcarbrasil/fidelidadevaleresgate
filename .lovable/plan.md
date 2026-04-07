

## Simplificar a Integração de Mobilidade — Eliminar Redundâncias

### Problema atual
Os 3 ambientes (Passageiro, Motorista, Notificações) repetem formulários e seletores desnecessariamente:
- **Credenciais da cidade** (api_key, basic_auth_user, basic_auth_password) aparecem duplicadas nos 2 sub-tabs "Por credenciais" e "Por URL" dentro de "Pontuar Motorista"
- **Seletor de cidade** aparece em Motorista E Notificações separadamente
- **Matrix** precisa ser preenchida manualmente mesmo sendo única — deveria já vir preenchida do banco
- O formulário de "Adicionar cidade" pede credenciais + modo (webhook/URL) mas ambos os modos pedem os mesmos campos

### Solução — Fluxo simplificado

```text
┌─────────────────────────────────────────────────────────────┐
│  CONFIGURAÇÃO GLOBAL (Card fixo no topo, fora das abas)    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Matriz: API Key / User / Senha [já preenchido]      │   │
│  │ Botão "Salvar" só se alterar                        │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  [🏆 Pontuar Passageiro] [🚗 Pontuar Motorista] [💬 Notif] │
├─────────────────────────────────────────────────────────────┤
│  Aba Passageiro:                                            │
│  - SEM form de matriz (está acima)                          │
│  - Endpoint primário (seletor por cidade)                   │
│  - Últimas pontuações                                       │
│  - Scored Customers                                         │
├─────────────────────────────────────────────────────────────┤
│  Aba Motorista:                                             │
│  - Cidades conectadas (cards)                               │
│  - Config da cidade selecionada (pontuação, webhook, diag)  │
│  - Adicionar cidade: UM ÚNICO form unificado                │
│    (cidade + api_key + user + senha + radio webhook/URL)    │
│  - Eventos em tempo real                                    │
│  - Scored Drivers                                           │
├─────────────────────────────────────────────────────────────┤
│  Aba Notificações:                                          │
│  - Seletor de cidade (das já ativas)                        │
│  - Toggle notificação app + Telegram                        │
└─────────────────────────────────────────────────────────────┘
```

### Mudanças específicas

**1. Extrair Card da Matriz para nível da página (`MachineIntegrationPage.tsx`)**
- Mover o card de credenciais Matrix para FORA das abas, no topo
- Criar componente `CardCredenciaisMatriz` em `src/features/integracao_mobilidade/components/card_credenciais_matriz.tsx`
- Campos já vêm preenchidos do `brandMatrix` (busca do banco)
- Se já configurado, mostrar badge "Configurado" e campos colapsados por padrão

**2. Limpar `aba_pontuar_passageiro.tsx`**
- Remover todo o formulário de Matrix (linhas 38-183) — agora está no card global
- Manter apenas: seletor de endpoint primário, últimas pontuações, scored customers

**3. Unificar formulário de adicionar cidade em `aba_pontuar_motorista.tsx`**
- Eliminar os 2 sub-tabs (credenciais vs URL) — são redundantes
- Um único formulário com: cidade + api_key + user + senha
- Adicionar um radio/select: "Modo de webhook" (Automático / Manual)
  - Automático: sistema registra webhook via API
  - Manual: após ativar, mostra a URL para copiar
- Isso reduz de ~200 linhas de formulário duplicado para ~80

**4. Nenhuma mudança na aba Notificações**
- Já está enxuta e sem redundância

### Arquivos

- **Criar**: `src/features/integracao_mobilidade/components/card_credenciais_matriz.tsx`
- **Editar**: `src/pages/MachineIntegrationPage.tsx` — renderizar Card Matriz acima das abas
- **Editar**: `src/features/integracao_mobilidade/components/aba_pontuar_passageiro.tsx` — remover form Matrix
- **Editar**: `src/features/integracao_mobilidade/components/aba_pontuar_motorista.tsx` — unificar form de adicionar cidade

