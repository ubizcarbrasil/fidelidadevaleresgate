

## Diagnóstico: 3 problemas encontrados no código atual

Comparei o fluxo que você descreveu com o código em `fetchRideData.ts` e encontrei **3 diferenças críticas**:

### 1. URL BASE ERRADA (provável causa do erro 400)

| O que você pediu | O que o código usa |
|---|---|
| `https://api-vendas.taximachine.com.br/api/integracao/recibo` | `https://api.taximachine.com.br/api/integracao/recibo` |

O domínio está errado: deveria ser **`api-vendas`**, não **`api`**. Isso explica por que o Recibo sempre retorna `400 "Solicitação não encontrada"` — está batendo no servidor errado.

### 2. Não valida `success = true` na resposta

O código atual pega o JSON e extrai direto os campos sem verificar se `success === true`. Se a API retornar `{ success: false, message: "..." }`, o sistema vai processar como se fosse válido.

### 3. Não extrai `telefone` e `email` do Recibo

O código assume que o Recibo **nunca** traz telefone (linha 36: `passengerPhone: null`). Mas