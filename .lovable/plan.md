

# Correção: Impersonação de Motorista e Isolamento de Cidade

## Problemas Identificados

### Problema 1: "Acessar Conta" sempre abre Pedro Henrique
**Causa raiz:** Quando o admin clica "Acessar Conta" para o motorista Danilo, o sistema grava uma `sessionRequest` no `localStorage`. Porém, se a leitura dessa request falhar (timing, aba reaproveitada, etc.), o sistema cai no fallback — que é o CPF salvo anteriormente no `localStorage` (`driver_session_cpf_{brandId}`). Se Pedro Henrique foi acessado antes, seu CPF está lá e é carregado.

**Correção:** No `AbaDadosMotorista.tsx`, ao clicar "Acessar Conta", **limpar o CPF antigo** do `localStorage` antes de gravar a nova session request. Assim, se a request falhar, não há fallback para o motorista errado. Adicionalmente, no `DriverSessionContext.tsx`, se um `sessionRequestKey` está presente na URL mas não existe no `localStorage`, **não cair no fallback de CPF salvo** — isso indica impersonação que falhou, não login normal.

### Problema 2: Cidade de outro motorista aparece no painel
**Causa raiz:** A URL de impersonação é `/driver?brandId=...&sessionKey=...` — **não inclui `branchId`**. Por isso `branch` fica `null` no `DriverMarketplace`, e queries de ofertas, achadinhos e duelos **não filtram por cidade**, mostrando dados de todas as cidades.

**Correção:** No `DriverPanelPage.tsx` (dentro do `DriverGate`), quando o `branch` da URL é `null` mas o `driver.branch_id` existe na sessão, **buscar automaticamente os dados da branch** e usá-la como contexto. Isso garante que o painel sempre opere na cidade correta do motorista.

## Arquivos Alterados

### 1. `src/components/driver-management/tabs/AbaDadosMotorista.tsx`
- No `handleOpenPwa`: limpar `driver_session_cpf_{brandId}` do `localStorage` antes de gravar a session request

### 2. `src/contexts/DriverSessionContext.tsx`
- Na lógica de restore: se `sessionRequestKey` existe mas a session request não foi encontrada no localStorage, **não** cair no fallback do CPF salvo (retornar sem driver, exigindo login manual)

### 3. `src/pages/DriverPanelPage.tsx`
- No `DriverGate`: quando `branch` é `null` e `driver.branch_id` existe, buscar os dados da branch via `supabase.from("branches").select("*").eq("id", driver.branch_id)` e usar como contexto
- Isso garante isolamento correto sem precisar mudar a URL de impersonação

## Resumo
- Problema 1 é resolvido eliminando o fallback para CPF antigo durante impersonação
- Problema 2 é resolvido derivando a branch do motorista logado quando não há `branchId` na URL

