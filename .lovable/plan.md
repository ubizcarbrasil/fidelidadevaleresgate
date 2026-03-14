

## Problema

Quando você ativa a integração pela aba **"Por URL"**, o campo de **API Key** (chave de acesso da TaxiMachine para consultar recibos) **não existe** nessa aba. Ele só aparece na aba "Por Credenciais".

No código atual, a ativação por URL deliberadamente **não envia** a `api_key` (linha 193: `if (!isUrlOnly && apiKey) body.api_key = apiKey`), e o sistema gera um placeholder `url-only-...`. Porém, o webhook precisa dessa chave para chamar o endpoint `api-vendas.taximachine.com.br/api/integracao/recibo` e buscar os dados da corrida.

## Solução

Adicionar o campo **"Chave de acesso (API Key)"** na aba "Por URL" da página de integração, e enviar essa chave no momento da ativação.

### Mudanças

| Arquivo | O que muda |
|---|---|
| `src/pages/MachineIntegrationPage.tsx` | Adicionar campo `api_key` na aba URL, criar state `urlApiKey`, enviar no body da ativação |

### Detalhes

1. **Novo state**: `urlApiKey` para armazenar a chave digitada na aba URL
2. **Novo campo na UI**: Input "Chave de acesso (API Key)" na aba URL, entre a cidade e o usuário, com toggle de visibilidade (mesmo padrão da aba credenciais)
3. **Texto explicativo atualizado**: Adicionar no passo-a-passo: "Informe a **chave de acesso** (API Key) fornecida pela TaxiMachine para consulta de recibos"
4. **Enviar no body**: Remover a condição `!isUrlOnly` da linha 193, passando `api_key` sempre que preenchida (seja da aba URL ou credenciais)
5. **Validação**: O botão "Ativar cidade" na aba URL só fica habilitado se `urlApiKey` estiver preenchido (além de usuário, senha e cidade)

