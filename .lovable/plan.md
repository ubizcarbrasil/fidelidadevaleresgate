

## Diagnóstico: a API da TaxiMachine envia `client.name: null`

Confirmei nos logs de produção de hoje (19:25 UTC). O payload V1 da corrida #675673808 contém:

```text
"stops":[{
  "client":{"name":null,"phone":null,"internationalPhone":null},
  ...
}]
```

O campo `client` **existe** no JSON, mas os valores são **todos null**. O endpoint Recibo continua retornando `400 - Solicitação não encontrada`. Ou seja, a TaxiMachine não está preenchendo os dados do passageiro — isso é uma configuração/limitação do lado deles.

## O que podemos fazer

Como a API não fornece o nome do cliente, temos duas opções práticas:

### 1. Identificação em lote (bulk) — novo recurso
Criar um botão **"Identificar em lote"** na página de Clientes que permite:
- Selecionar múltiplos clientes "Passageiro corrida #..."
- Preencher nome, CPF e telefone de uma vez
- Ou importar via CSV (nome, CPF, telefone) para vincular aos registros existentes

### 2. Melhorar o botão "Identificar" existente
O botão já existe nas "Últimas pontuações". Garantir que:
- Ao clicar, os dados sejam salvos corretamente no cliente, na corrida e na notificação
- O nome atualizado apareça imediatamente na tela sem precisar recarregar

### 3. Contatar a TaxiMachine
Solicitar ao suporte da TaxiMachine que habilitem o envio dos dados do passageiro no webhook/API. O campo `client` já existe na estrutura — só precisa ser preenchido do lado deles. Isso resolveria o problema na raiz.

### Recomendação
A solução definitiva é a opção **3** (TaxiMachine preencher os dados). As opções 1 e 2 são paliativas para uso imediato enquanto a API não envia os dados.

