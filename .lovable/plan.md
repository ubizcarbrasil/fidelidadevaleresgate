

## Plano: 3 funcionalidades

### 1. Logo da marca no painel do empreendedor (BrandSettingsPage)

**Arquivo:** `src/pages/BrandSettingsPage.tsx`

O painel do empreendedor (`BrandSettingsPage`) não exibe nenhuma logomarca atualmente. Vou adicionar o logo da marca no topo da página, usando o hook `useBrandInfo` que já existe em `src/hooks/useBrandName.ts`.

- Importar `useBrandInfo` e `PlatformLogo`
- Renderizar o logo ao lado do título "Configurações — Métricas Gerais"
- Fallback para iniciais se não houver logo configurado

### 2. Logo da loja no dashboard do parceiro (StoreOwnerPanel)

**Arquivo:** `src/pages/StoreOwnerPanel.tsx`

O header já exibe o logo da loja (linha 229-234), mas o dashboard interno (`StoreOwnerDashboard`) não tem logo. Vou adicionar o logo da loja no topo do dashboard (após o card de completude do perfil), junto ao nome da loja.

- Na função `StoreOwnerDashboard`, exibir `store.logo_url` em destaque antes dos KPIs
- Fallback para ícone `Store` se não houver logo

### 3. Importação CSV para pontuar clientes manualmente

**Arquivo:** `src/pages/CsvImportPage.tsx`

Adicionar um novo tipo de importação `EARNING_EVENTS` ao motor CSV existente, com os campos solicitados:

| Campo CSV | Campo destino | Obrigatório |
|---|---|---|
| Nome | name (busca cliente) | Sim |
| CPF | cpf (busca cliente) | Não |
| E-mail | email (busca cliente) | Não |
| Telefone | phone (busca cliente) | Não |
| Valor da viagem | purchase_value | Sim |
| Data | created_at | Não |

**Lógica de processamento:**
1. Para cada linha, buscar o cliente na tabela `customers` por CPF, telefone ou nome
2. Se não encontrar, criar o cliente automaticamente
3. Buscar a regra de pontos ativa (`points_rules`) para calcular `points_earned` e `money_earned`
4. Inserir `earning_event` com `source: 'CSV_IMPORT'` e `status: 'APPROVED'`
5. Inserir entrada no `points_ledger` (CREDIT)
6. Atualizar saldo do cliente (`points_balance`, `money_balance`)

**Alterações no CsvImportPage:**
- Adicionar `EARNING_EVENTS` ao tipo `ImportType`
- Definir `EARNING_EVENT_FIELDS` com os 6 campos
- Adicionar validação específica (valor numérico obrigatório, data válida)
- Adicionar lógica de processamento no `importMutation`
- Adicionar opção "Pontuação Manual" no seletor de tipo de importação

**Obs:** O enum `earning_source` precisa suportar `'CSV_IMPORT'`. Se não existir, usaremos `'MANUAL'` ou o valor mais adequado já disponível no enum.

### Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `src/pages/BrandSettingsPage.tsx` | Adicionar logo da marca no topo |
| `src/pages/StoreOwnerPanel.tsx` | Adicionar logo da loja no dashboard |
| `src/pages/CsvImportPage.tsx` | Novo tipo EARNING_EVENTS com processamento completo |

