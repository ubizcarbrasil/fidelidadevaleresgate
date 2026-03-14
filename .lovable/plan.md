

## Situação real: a API da TaxiMachine não retorna dados do passageiro

Analisei os logs de produção em detalhe. O JSON retornado pelo endpoint V1 contém **apenas**:
- `request_id`, `category`, `driver` (nome, telefone, CPF), `progress`, `finished` (valor, endereço)
- **Não existe** campo `client`, `passenger`, `stops` ou qualquer dado do passageiro

O endpoint Recibo (que teria o CPF do cliente) retorna `400 "Solicitação não encontrada"` para todas as corridas.

**Conclusão**: a TaxiMachine não está enviando dados do cliente pela API. Não é um bug do nosso código — é uma limitação da API deles.

---

## Plano: permitir identificação manual + auto-registro do cliente

### 1. Remover referências ao motorista das telas de cliente
- Parar de mostrar "Motorista: X" nas telas de clientes/pontuações (isso confunde)
- Mostrar "Cliente não identificado" com botão de ação para editar

### 2. Melhorar edição inline na tela "Últimas pontuações"
- Adicionar botão "Identificar cliente" em cada notificação sem nome
- Ao clicar, abre dialog para digitar nome, CPF e telefone do cliente
- Salva nos 3 lugares: `customers`, `machine_rides`, `machine_ride_notifications`

### 3. Busca por CPF/telefone na página de Clientes
- Adicionar busca por CPF além de nome/telefone (já tem nome e telefone)
- Permitir merge: se identificar que dois "Passageiro corrida #..." são a mesma pessoa, unificar

### 4. Telegram: mostrar "Cliente não identificado" em vez do nome do motorista
- Remover `driver_name` da mensagem de cliente
- Manter motorista como informação separada (campo próprio, não confundindo com cliente)

### Resultado
- Telas param de confundir motorista com cliente
- Operador pode identificar clientes manualmente até a TaxiMachine liberar dados de passageiro na API
- Dados corretos nas 4 telas solicitadas

