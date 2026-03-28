

# Criar grupo dedicado "Resgate com Pontos" no menu lateral

## Problema
Os itens de resgate (Produtos, Regras, Pedidos) estão misturados dentro do grupo "Achadinhos", dificultando a visibilidade e o acesso rápido a tudo que envolve o módulo de resgate.

## Solução
Extrair os itens relacionados a resgate para um **novo grupo independente** no menu lateral chamado **"Resgate com Pontos"**, posicionado logo após o grupo "Achadinhos".

## Alterações

### 1. `src/components/consoles/BrandSidebar.tsx`
- **Remover** do grupo "Achadinhos" os três itens: `produtos_resgate`, `regras_resgate`, `pedidos_resgate`
- **Criar** novo grupo com label `"Resgate com Pontos"` contendo:
  - Produtos de Resgate (`/produtos-resgate`, ícone ShoppingBag)
  - Regras de Resgate (`/regras-resgate`, ícone Settings2)
  - Pedidos de Resgate (`/product-redemption-orders`, ícone Package)

### 2. `src/hooks/useMenuLabels.ts`
- Adicionar as três chaves que estão faltando no `DEFAULT_LABELS.admin`:
  - `"sidebar.produtos_resgate": "Produtos de Resgate"`
  - `"sidebar.regras_resgate": "Regras de Resgate"`
  - `"sidebar.pedidos_resgate": "Pedidos de Resgate"`

## Resultado
O menu lateral terá a seguinte estrutura:

```text
Achadinhos
  ├── Achadinhos
  ├── Categorias de Achadinhos
  ├── Espelhamento Achadinho
  ├── Governança Achadinho
  └── Painel do Motorista

Resgate com Pontos        ← NOVO GRUPO
  ├── Produtos de Resgate
  ├── Regras de Resgate
  └── Pedidos de Resgate
```

