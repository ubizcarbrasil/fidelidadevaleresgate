

# Fase 1 — Login por CPF e Perfil do Motorista

## O que muda

O motorista acessa o marketplace de Achadinhos e vê uma tela de login por CPF. Ao digitar o CPF, o sistema busca o registro `customers` com aquele CPF + `brand_id` + tag `[MOTORISTA]`. Se encontrado, a sessão é criada localmente (sem Supabase Auth). O header passa a exibir saldo de pontos e um botão de perfil com overlay mostrando dados e extrato.

## Arquivos novos

### 1. `src/contexts/DriverSessionContext.tsx`
- Contexto que gerencia a sessão do motorista por CPF
- Estado: `driverCustomer` (registro da tabela `customers`), `loading`, `logout()`
- Persiste o CPF no `localStorage` (chave por `brandId`)
- Ao montar, tenta restaurar sessão do localStorage; busca `customers` por `cpf + brand_id + name ilike '%[MOTORISTA]%'`
- Função `loginByCpf(cpf: string)`: busca o customer, se encontrar armazena e retorna sucesso
- Exporta hook `useDriverSession()`

### 2. `src/components/driver/DriverCpfLogin.tsx`
- Tela fullscreen de login: campo de CPF com máscara (###.###.###-##)
- Logo da marca no topo, título "Acesse sua conta"
- Botão "Entrar" que chama `loginByCpf`
- Estados: loading, erro ("CPF não cadastrado")
- Visual dark mode, consistente com o marketplace

### 3. `src/components/driver/DriverProfileOverlay.tsx`
- Overlay/drawer lateral que abre ao clicar no avatar do header
- Exibe: Nome (sem tag [MOTORISTA]), CPF, E-mail, Telefone, Cidade (branch name), Saldo de pontos
- Seção "Extrato de Pontos": lista do `points_ledger` filtrado por `customer_id`, ordenado por data desc
- Cada linha: descrição, data, +/- pontos (verde/vermelho)
- Botão "Sair" que limpa a sessão

## Arquivos editados

### 4. `src/pages/DriverPanelPage.tsx`
- Envolve tudo com `DriverSessionProvider`
- Se não há sessão ativa, renderiza `DriverCpfLogin` ao invés do marketplace
- Remove dependência do `CustomerProvider` para o fluxo do motorista (ou mantém como fallback)

### 5. `src/components/driver/DriverMarketplace.tsx`
- No header, adicionar:
  - Badge de saldo de pontos (ícone moeda + "X pts") à esquerda dos botões existentes
  - Botão de avatar/perfil que abre `DriverProfileOverlay`
- Consome `useDriverSession()` para pegar o customer e saldo

## Fluxo

```text
DriverPanelPage
  └─ DriverSessionProvider (brandId)
       ├─ Sem sessão → DriverCpfLogin
       └─ Com sessão → DriverMarketplace
                          ├─ Header: [logo] [título] ... [saldo pts] [perfil] [?] [wa] [share]
                          └─ DriverProfileOverlay (drawer)
                               ├─ Dados pessoais
                               ├─ Extrato de pontos
                               └─ Botão Sair
```

## Detalhes técnicos
- Query do login: `customers.select('*, branches(name)').eq('brand_id', X).eq('cpf', cpfLimpo).ilike('name', '%[MOTORISTA]%').maybeSingle()`
- localStorage key: `driver_session_cpf_${brandId}`
- Extrato: `points_ledger.select('*').eq('customer_id', id).order('created_at', { ascending: false }).limit(50)`
- Máscara de CPF: formatação visual no input, armazenamento somente dígitos
- 6 arquivos total (3 novos + 3 editados)

