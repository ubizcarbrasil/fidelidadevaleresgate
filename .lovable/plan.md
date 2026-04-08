
## Correção definitiva: “Acessar Conta” ainda abre outro motorista

### O problema real
Revisei o fluxo e a causa agora está clara:

- O botão **Acessar Conta** só cria a sessão especial quando o motorista tem **CPF**.
- No print atual, o motorista exibido é **Elton Ricardo Da Silva (D)** e o campo **CPF está vazio**.
- No banco, esse motorista também está sem CPF.
- Quando isso acontece, o código abre apenas `/driver?brandId=...` sem `sessionKey` válido.
- A tela do motorista então reaproveita a sessão antiga salva no `localStorage`, que neste caso continua sendo **Pedro Henrique**.

### Do I know what the issue is?
Sim. O erro não é mais só reaproveitamento de aba. O problema principal é:
**motoristas sem CPF não entram no novo fluxo de sessão e caem na sessão antiga persistida do navegador.**

## O que vou ajustar

### 1) Trocar a impersonação de CPF para ID do motorista
Hoje o acesso administrativo depende de CPF. Isso falha para motoristas sem CPF.

Vou mudar para um fluxo baseado no **`customer.id`** do motorista:
- no admin, o botão **Acessar Conta** sempre gera um `sessionKey`
- grava no `localStorage` uma requisição temporária com:
  - `customerId`
  - `cpf` opcional como fallback
- abre `/driver?brandId=...&sessionKey=...`

Assim o acesso funciona mesmo quando o motorista não tem CPF.

### 2) Criar busca segura do motorista por ID no backend
Como a rota `/driver` é pública e hoje já usa uma função segura para buscar por CPF, vou seguir o mesmo padrão:
- criar nova RPC segura, por exemplo `lookup_driver_by_id`
- validar:
  - `brand_id`
  - `customer_id`
  - nome com tag de motorista
- retornar os mesmos campos usados hoje no `DriverSessionContext`

Isso evita depender de leitura direta da tabela no cliente.

### 3) Atualizar o `DriverSessionContext`
Vou ajustar o provider para:
- priorizar a requisição temporária do `sessionKey`
- se vier `customerId`, buscar por ID
- se vier só `cpf`, usar o fluxo antigo
- só usar `driver_session_cpf_{brandId}` como último fallback
- limpar a chave temporária após carregar

### 4) Reforçar sincronização em mobile
Além do `visibilitychange`, vou considerar também o ciclo de retorno da página em mobile/bfcache com revalidação da sessão temporária ao reabrir a tela, para evitar estado preso em aba reaproveitada.

## Arquivos que entram na correção

### Frontend
- `src/components/driver-management/tabs/AbaDadosMotorista.tsx`
- `src/contexts/DriverSessionContext.tsx`
- `src/pages/DriverPanelPage.tsx` (se precisar apenas manter/ajustar leitura da chave)

### Banco
- `supabase/migrations/...sql`
  - nova RPC segura para buscar motorista por ID

## Resultado esperado
```text
Admin abre Elton
→ sistema salva session request com customerId do Elton
→ /driver recebe sessionKey
→ DriverSessionProvider busca Elton por ID
→ conta aberta será exatamente a do Elton
→ não reaproveita Pedro Henrique
```

## Validação que vou fazer na implementação
1. Testar motorista com CPF
2. Testar motorista sem CPF
3. Testar abrir Pedro e depois Elton na mesma aba/mobile
4. Testar retorno de aba reaproveitada
5. Confirmar que nunca cai em sessão antiga quando existe `sessionKey`

## Detalhe técnico importante
A correção anterior reduziu o problema de aba reaproveitada, mas **não cobriu o caso de motorista sem CPF**. Por isso o bug continuou aparecendo exatamente nesse cenário.
