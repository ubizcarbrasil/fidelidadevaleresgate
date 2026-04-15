

## Acesso ao Preview do Lovable no Dashboard

### O que será feito

Adicionar um card/link no Dashboard que abre a URL de preview do Lovable (`https://id-preview--3ff47979-b8b4-4666-bfef-7987c2d119c3.lovable.app`) diretamente, permitindo testar mudanças antes de publicar.

### Solução

Adicionar um novo link externo na seção "Links Úteis" do `DashboardQuickLinks.tsx` com:
- Label: **"Preview (Dev)"**
- Descrição: "Versão de teste antes de publicar"
- Ícone: `Eye`
- URL fixa: `https://id-preview--3ff47979-b8b4-4666-bfef-7987c2d119c3.lovable.app`
- Sem filtro de scoring (sempre visível)
- Botões "Abrir" e "Copiar"

### Arquivo afetado

1. **`src/components/dashboard/DashboardQuickLinks.tsx`** — Adicionar card de preview na seção de links

### Detalhes técnicos

Será adicionado como um card standalone antes dos links externos, com URL hardcoded do preview. Incluirá o `brandId` como query param para manter o contexto da marca.

