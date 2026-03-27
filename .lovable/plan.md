

## Painel de Gestão de Motoristas

Nova página dedicada acessível pelo menu lateral da marca, consolidando todas as operações de gestão de motoristas em um único lugar.

### Menu no Sidebar

Adicionar item **"Motoristas"** com ícone `Truck` no grupo **"Gestão Comercial"**, logo abaixo de "Clientes". URL: `/motoristas`. Sem `moduleKey` obrigatório (ou reutilizar `machine_integration`).

### Nova página `/motoristas` — DriverManagementPage

Página com listagem de motoristas (clientes com tag `[MOTORISTA]`) e as seguintes funcionalidades:

| Funcionalidade | Implementação |
|---|---|
| **Dados cadastrais** | Sheet lateral com nome, CPF, telefone, e-mail, cidade/branch, tier, saldo de pontos |
| **Mudar senha** | Botão que abre dialog para reset de senha via `supabase.auth.admin.resetPasswordForEmail` (edge function) |
| **Ver pontos / Extrato** | Reutilizar query do `points_ledger` filtrado pelo `customer_id` do motorista |
| **Adicionar pontos** | Reutilizar `ManualDriverScoringDialog` já existente |
| **Cidade (branch)** | Select para alterar `branch_id` do motorista |
| **Desativar pontuação** | Toggle que seta um campo `scoring_disabled` (ou atualiza status) no registro do motorista |
| **Alterar regra individual** | Inline edit de `points_per_real` ou modo de pontuação específico do motorista (via campo custom na tabela customers ou driver_points_rules) |
| **Baixar relatório** | Export CSV do extrato de pontos do motorista selecionado |
| **Acessar conta** | Botão que abre o PWA do motorista em nova aba (`/customer?brand=...`) usando o login dele |

### Estrutura de arquivos

```
src/pages/DriverManagementPage.tsx          — página principal com listagem
src/components/driver-management/
  DriverDetailSheet.tsx                     — sheet lateral com dados + ações
  DriverScoringToggle.tsx                   — toggle ativar/desativar pontuação
  DriverRuleEditor.tsx                      — editor de regra individual
  DriverPasswordReset.tsx                   — dialog de reset de senha
  DriverLedgerSection.tsx                   — extrato de pontos inline
```

### Migração de banco (se necessário)

Adicionar coluna `scoring_disabled boolean NOT NULL DEFAULT false` na tabela `customers` para permitir desativar pontuação individualmente por motorista.

### Alterações no roteamento

- `App.tsx`: Adicionar rota `/motoristas` → `DriverManagementPage`
- `BrandSidebar.tsx`: Adicionar item no grupo "Gestão Comercial"

### Detalhes técnicos

- A listagem filtra `customers` por `name ILIKE '%[MOTORISTA]%'` (padrão já existente no `ScoredDriversPanel`)
- O extrato consulta `points_ledger` por `customer_id`
- O export CSV reutiliza o padrão do `ScoredDriversPanel.handleExportCsv`
- O reset de senha requer uma edge function que use `supabase.auth.admin.resetPasswordForEmail` (service role)
- A regra individual de pontuação edita `driver_points_rules` filtrada por motorista ou cria override personalizado

