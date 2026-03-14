

## Criar documentação MD do fluxo TaxiMachine

Criar o arquivo `TAXIMACHINE_FLOW.md` na raiz do projeto documentando o fluxo completo desde o recebimento do webhook até a pontuação do cliente.

### Conteudo

O documento cobrira:

1. **Webhook recebido** - payload da TaxiMachine (`id_solicitacao`, `status_solicitacao`) e como a integracão e localizada (`x-api-secret`, `brand_id`, `branch_id`)

2. **Consulta ao Recibo** - chamada ao endpoint `GET https://api.taximachine.com.br/api/integracao/recibo?id_mch={id}` com headers `api-key` e `User-Agent: ua-ubizcar`, mostrando o JSON de retorno (valor, CPF, nome do passageiro)

3. **Consulta Request V1 (enriquecimento)** - chamada ao `GET https://api.taximachine.com.br/api/v1/request/{id}` para obter o telefone do passageiro quando o Recibo nao retorna

4. **Busca do cliente (cascade)** - ordem de busca: CPF → telefone → nome exato na tabela `customers`

5. **Criacao de cliente** - quando nenhum match e encontrado, cria automaticamente

6. **Credito de pontos** - insere no `points_ledger` e atualiza `points_balance`

7. **Diagrama ASCII** do fluxo completo

### Arquivo

`TAXIMACHINE_FLOW.md` na raiz do projeto

