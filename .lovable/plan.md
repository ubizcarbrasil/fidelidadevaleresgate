

# Plano: Criar seção dedicada "Integrações" no editor da marca

## O que muda

Mover o campo **WhatsApp (Achadinhos)** da seção "Textos" para uma nova seção **"Integrações"** com ícone próprio (`Link` ou `Plug`), posicionada após "Textos" e antes de "Layout & Dimensões". Isso dá mais visibilidade ao campo e prepara a estrutura para futuras integrações.

## Alterações

### 1. `src/components/BrandThemeEditor.tsx`
- Remover o bloco do WhatsApp (linhas 413-424) da seção "Textos"
- Adicionar nova seção `Card` com título "Integrações" e ícone `Plug` (lucide-react)
- Condicionar exibição com `canShow("theme_integrations")`
- Conteúdo: campo WhatsApp com ícone verde, input e texto auxiliar (igual ao atual)

### 2. Imports
- Adicionar `Plug` ao import de `lucide-react`

Nenhuma mudança em tipos, hooks ou banco de dados — apenas reorganização visual.

