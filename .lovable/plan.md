

## Diagnóstico: Dados do cliente ausentes nas telas

### Problema identificado

Analisei os logs e o banco de dados. O problema é na **origem dos dados da TaxiMachine**:

1. **Endpoint Recibo** retorna `400 - "Solicitacao não encontrada"` para todas as corridas recentes. Este é o endpoint que fornece **nome e CPF** do passageiro.
2. **Endpoint Request V1** (fallback) retorna o valor da corrida mas `stops[0].client` vem vazio — sem nome, CPF ou telefone.
3. Resultado: clientes criados como `"Passageiro corrida #675..."` sem nenhum dado pessoal, e notificações com `customer_name = null` ("Não identificado").

Todos os 51 clientes na lista estão nessa condição — `cpf: null`, `phone: null`, `name: "Passageiro corrida #..."`.

### Plano de correção (3 etapas)

**1. Capturar o JSON bruto do V1 nos logs**
- Adicionar log do payload completo do Request V1 em `fetchRideData.ts` (primeiros 1000 chars) para identificar se existem campos de cliente em outra estrutura que não estamos parseando (ex: `client` na raiz, `passenger`, etc.)

**2. Investigar o formato do `id_mch` no Recibo**
- O Recibo falha com "Solicitação não encontrada" para IDs como `675656827`. Pode ser que o endpoint espere um formato diferente (ex: com prefixo, ou um ID interno diferente do `id_solicitacao`).
- Adicionar log do `raw_payload` recebido no webhook para verificar se existe outro campo de ID que deveria ser usado no Recibo (ex: `id_recibo`, `numero_recibo`).

**3. Criar edge function de backfill para atualizar clientes existentes**
- Uma função `retry-failed-rides` que re-consulta os endpoints para corridas já processadas com `passenger_cpf IS NULL`, tentando enriquecer os dados quando a API estiver disponível.
- Atualiza `customers.name`, `customers.cpf`, `customers.phone` e `machine_rides.passenger_cpf` com os dados encontrados.
- Atualiza `machine_ride_notifications` para que a tela "Últimas pontuações" também mostre os nomes corretos.

### Resultado esperado

- Tela **"Últimas pontuações"**: mostrará nome, CPF mascarado e telefone do passageiro em vez de "Não identificado"
- Tela **"Clientes"**: mostrará dados reais (nome, CPF, telefone) em vez de "Passageiro corrida #..."
- Novos webhooks passarão a capturar os dados corretamente após identificar o campo/formato correto

