

## Plano: Reorganizar painel de integração com dois modos de ativação claros

### Problema atual
A página mistura informações técnicas (URL do webhook, x-api-secret, basic auth) de forma desorganizada. O empreendedor não entende o que precisa fazer. Existem cards redundantes e termos confusos.

### O que será feito

**Reorganizar a `MachineIntegrationPage.tsx` em seções claras com dois modos de ativação:**

**1. Escolha do tipo de ativação (Tabs ou cards selecionáveis)**
- **Opção A - Ativação por URL**: O empreendedor apenas copia a URL do webhook e cola na plataforma externa. Sem necessidade de credenciais. Instruções simples: "Copie a URL abaixo e cole na sua plataforma de mobilidade."
- **Opção B - Ativação por Webhook com credenciais**: O empreendedor configura API Key + usuário/senha para autenticação segura. Para quem quer integração automática com registro de webhook na TaxiMachine.

**2. Instruções claras e didáticas**
- Substituir o card "Como funciona?" por instruções contextuais dentro de cada modo de ativação
- Usar linguagem simples, sem jargões técnicos (ex: "chave de acesso" em vez de "API Key")
- Adicionar um passo-a-passo numerado e visual para cada opção

**3. Limpeza e organização**
- Remover o card "URL do Webhook" separado (agora faz parte da Opção A)
- Remover o card "Como funciona?" avulso (instruções agora estão integradas)
- Manter o dashboard de status, feed em tempo real e callback URL apenas quando a integração estiver ativa
- Agrupar visualmente: (1) Escolha do modo → (2) Dashboard de status → (3) Feed tempo real → (4) Callback URL

**4. Estrutura final da página**

```text
┌─────────────────────────────────┐
│ Header: Integração Mobilidade   │
├─────────────────────────────────┤
│ [Se inativo] Escolha como ativar│
│                                 │
│  ┌─────────┐  ┌──────────────┐  │
│  │ Por URL  │  │ Por Webhook  │  │
│  │ (simples)│  │ (automático) │  │
│  └─────────┘  └──────────────┘  │
│                                 │
│  Instruções do modo selecionado │
│  + campos necessários           │
├─────────────────────────────────┤
│ [Se ativo] Dashboard de status  │
│ [Se ativo] Feed tempo real      │
│ [Se ativo] Callback URL         │
└─────────────────────────────────┘
```

### Alterações
| Componente | Acao |
|---|---|
| `MachineIntegrationPage.tsx` | Reescrever layout com tabs de ativacao, instrucoes claras, remover cards redundantes |

Nenhuma alteracao de banco de dados ou edge function necessaria -- apenas reorganizacao do frontend.

