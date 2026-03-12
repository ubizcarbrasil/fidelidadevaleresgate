

## Plano: Seed de Categorias e Vinculação Automática de Deals

### Estado Atual
- **Urbano Norte** (`8f76ce52`): já tem 16 categorias seedadas, mas 2 deals sem `category_id`:
  - "iPhone 17 Pro Max 512gb" → match com keywords "smartphone" → **Eletrônicos**
  - "Marcado livre" → sem match claro com nenhuma categoria
- **Marca Teste** (`2750cec8`): sem categorias, 1 deal ("Achadinhos") sem categoria

### Ações

1. **Seed categorias para "Marca Teste"** — chamar a RPC `seed_affiliate_categories` existente via código ou executar INSERT direto

2. **Vincular deals existentes às categorias**:
   - `iPhone 17 Pro Max 512gb` → categoria **Eletrônicos** (`77d18a9c-80c7-41e2-8f80-77995a93fab2`)
   - `Marcado livre` → sem match automático, será mantido sem categoria (ou posso vincular a "Cupons" se preferir)
   - `Achadinhos` (Marca Teste) → sem match claro, será mantido sem categoria

Todas as operações serão feitas via INSERT/UPDATE tool no banco.

