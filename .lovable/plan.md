

## Plano: Corrigir chamada Recibo — credenciais da Matriz + parseRecibo para array

### Problema
1. **Credenciais erradas**: O endpoint Recibo exige `api-key` e `Authorization: Basic` **da matriz**, não da cidade. Hoje o código usa `receipt_api_key` / `basic_auth_*` da integração (que são da cidade).
2. **Parse incorreto**: A resposta do Recibo é um **array** `[{ success, response: { ... } }]`, mas o `parseRecibo` espera um objeto simples.

### Solução

#### 1. Migração de banco — 3 novas colunas em `machine_integrations`
```sql
ALTER TABLE public.machine_integrations
  ADD COLUMN IF NOT EXISTS matrix_api_key text DEFAULT null,
  ADD COLUMN IF NOT EXISTS matrix_basic_auth_user text DEFAULT null,
  ADD COLUMN IF NOT EXISTS matrix_basic_auth_password text DEFAULT null;
```

#### 2. `supabase/functions/_shared/fetchRideData.ts`

**a) Corrigir `parseRecibo`** para tratar array:
```typescript
function parseRecibo(json: any): Omit<RideData, "source"> | null {
  const item = Array.isArray(json) ? json[0] : json;
  if (item?.success === false) { return null; }
  const response = item?.response || item;
  const clienteBlock = response?.cliente || {};
  const motoristaBlock = response?.motorista || response?.condutor || {};
  const corridaBlock = response?.corrida || response?.dados_solicitacao || {};
  return {
    rideValue: Number(corridaBlock.valor || 0),
    passengerName: clienteBlock.nome || null,
    passengerCpf: (clienteBlock.cpf || "").replace(/\D/g, "") || null,
    passengerPhone: null,
    passengerEmail: null,
    driverName: motoristaBlock.nome || null,
  };
}
```

**b) Nova função `buildMatrixHeaders`** que usa credenciais da matriz:
```typescript
export function buildMatrixHeaders(
  matrixApiKey: string, matrixUser: string, matrixPass: string
): Record<string, string>
```

**c) Alterar assinatura de `fetchRideData`** para aceitar headers separados para o Recibo:
```typescript
export async function fetchRideData(
  headers: Record<string, string>,
  machineRideId: string,
  preferredEndpoint?: "recibo" | "request_v1",
  matrixHeaders?: Record<string, string>  // novo - se fornecido, usa para Recibo
)
```
Dentro das chamadas ao endpoint Recibo, usa `matrixHeaders ?? headers`.

#### 3. `supabase/functions/machine-webhook/index.ts`

Na função `processFinalized`, montar os headers da matriz a partir das novas colunas e passá-los para `fetchRideData`:
```typescript
const matrixApiKey = (integration.matrix_api_key || "").trim();
const matrixUser = (integration.matrix_basic_auth_user || "").trim();
const matrixPass = (integration.matrix_basic_auth_password || "").trim();
const matrixHeaders = matrixApiKey
  ? buildApiHeaders(matrixApiKey, matrixUser, matrixPass)
  : undefined; // fallback para headers da cidade
```

#### 4. `src/pages/MachineIntegrationPage.tsx`

Adicionar 3 campos no formulário de integração dentro de uma seção "Credenciais da Matriz (Recibo)":
- **Chave API da Matriz** (`matrix_api_key`)
- **Usuário Basic Auth da Matriz** (`matrix_basic_auth_user`)
- **Senha Basic Auth da Matriz** (`matrix_basic_auth_password`)

#### 5. Mesmas correções em `test-machine-credentials` e `retry-failed-rides`

Usar `matrixHeaders` quando disponíveis para testar/reprocessar o endpoint Recibo.

### Resultado
- Recibo usa credenciais da matriz (obrigatório pela API)
- V1 continua usando credenciais da cidade
- Parse trata o formato real (array) da resposta
- Formulário permite configurar ambos os conjuntos de credenciais

