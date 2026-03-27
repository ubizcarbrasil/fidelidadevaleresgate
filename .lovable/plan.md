
Objetivo: corrigir o enriquecimento dos motoristas para que CPF, telefone e e-mail deixem de vir nulos quando `fetchDriverDetails` consulta `/api/integracao/condutor`.

Diagnóstico encontrado:
- O fluxo atual extrai o `driverId` do webhook em `links.driver` e usa esse valor corretamente como fallback determinístico.
- A pontuação do motorista funciona, então o problema não está na identificação principal nem no crédito de pontos.
- O endpoint de corrida e o endpoint de cliente funcionam com as credenciais atuais.
- O ponto fraco está aqui: `machine-webhook` chama `fetchDriverDetails(driverId, driverHeaders)` usando `matrixHeaders ?? cityHeaders`, ou seja, tenta apenas um conjunto de credenciais.
- Os logs mostram padrão consistente: `Fetching driver details` seguido de `Driver details response empty`, sem erro HTTP e sem `success=false`. Isso indica resposta 200 com `response` vazio.
- Como o endpoint `/cliente` enriquece corretamente com credenciais matrix, a hipótese mais provável é: `/condutor` exige credenciais de cidade em alguns casos, ou responde vazio com matrix mesmo quando o `driverId` é válido.

Plano de implementação:
1. Ajustar `fetchDriverDetails` em `supabase/functions/_shared/fetchRideData.ts`
- Receber dois conjuntos de headers: matrix e cidade.
- Tentar primeiro com matrix quando existir.
- Se a resposta vier vazia, tentar novamente com city headers.
- Padronizar um helper interno para interpretar a resposta e diferenciar:
  - erro HTTP
  - `success=false`
  - `response` vazio
  - sucesso com dados
- Adicionar logs mais explícitos informando qual credencial foi usada e se houve fallback.

2. Atualizar a chamada no webhook em `supabase/functions/machine-webhook/index.ts`
- Parar de enviar apenas `driverHeaders`.
- Passar `matrixHeaders` e `cityHeaders` separadamente para `fetchDriverDetails`.
- Manter a regra atual de usar `payloadDriverId` como fallback do `apiDriverId`.

3. Melhorar a observabilidade
- Logar um trecho curto do payload bruto retornado por `/condutor` quando a resposta vier vazia.
- Logar qual estratégia resolveu:
  - `matrix`
  - `city`
  - `matrix_then_city`
- Isso permite validar rapidamente em produção sem alterar o comportamento do restante do fluxo.

4. Garantir impacto mínimo no restante do fluxo
- Não mexer na lógica de criação/atualização do customer motorista, só no enriquecimento.
- Manter `external_driver_id` como chave principal de deduplicação.
- Manter fallback de nome atual quando a API continuar sem devolver dados.

Resultado esperado:
- Motoristas novos passam a ser criados com CPF, telefone e e-mail quando o endpoint aceitar as credenciais de cidade.
- Motoristas existentes continuam sendo localizados por `external_driver_id`, mas com chance maior de atualização correta no espelho de CRM e nos próximos cadastros.
- Se ainda vier vazio com ambos os headers, os logs vão mostrar de forma objetiva se o problema é de credencial ou de semântica do `driverId`.

Detalhes técnicos:
```text
machine-webhook
  -> extrai payloadDriverId de links.driver
  -> fetchRideData(...) resolve corrida/passageiro
  -> fetchDriverDetails(driverId, matrixHeaders, cityHeaders)
       1. tenta /condutor com matrix
       2. se response vazio, tenta /condutor com city
       3. retorna dados normalizados ou nulos
  -> customer do motorista é criado/atualizado
  -> crm_contacts recebe dados enriquecidos
```

Arquivos envolvidos:
- `supabase/functions/_shared/fetchRideData.ts`
- `supabase/functions/machine-webhook/index.ts`

Critério de validação após implementar:
- Ver em logs pelo menos um caso com fallback bem-sucedido ou confirmação de vazio com ambos headers.
- Confirmar que novos motoristas processados deixam de ficar com `cpf`, `phone` e `email` nulos quando a API responder dados.
