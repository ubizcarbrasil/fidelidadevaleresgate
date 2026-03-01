

## Rotas faltantes no Painel Root

Duas rotas administrativas registradas no `App.tsx` não possuem entrada no `RootSidebar`:

### 1. `/pdv` — Operador PDV (OperatorRedeemPage)
- Adicionar ao grupo **"🏪 Operações"** com o título "Operador PDV" e ícone apropriado (ex: `ScanLine` ou `Monitor`)

### 2. `/store-points-rule` — Regra de Pontos da Loja (StorePointsRulePage)
- Adicionar ao grupo **"💰 Programa de Pontos"** com o título "Regra de Pontos do Parceiro" e ícone `Settings2` ou `Coins`

### Alterações
- **Arquivo**: `src/components/consoles/RootSidebar.tsx`
  - Importar ícones adicionais (`ScanLine` ou equivalente)
  - Inserir os dois novos itens nos respectivos grupos

Nenhuma mudança de banco de dados ou lógica é necessária — apenas a adição dos links no menu lateral.

