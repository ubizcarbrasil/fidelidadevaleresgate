

## Atualizar Previews do Painel Admin com o Novo Padrão

### Problema
Os componentes de preview/simulador mobile no painel administrativo ainda mostram o padrão antigo (ex: "R$ 9,90", "R$ 14,90", "≈ R$ 12,50") em vez do novo padrão com pontos ("pts"). Isso afeta tanto o Root Admin quanto os Empreendedores (Brand Admins), que compartilham as mesmas telas de preview.

### Arquivos a Alterar

**1. `src/components/HomeTemplateMobilePreview.tsx`**
- Linha 62: `R$ 9,90` → `90 pts`
- Linha 80: `R$ 14,90` → `150 pts`
- Linha 264: Remover `≈ R$ 12,50`
- Linha 263: `1.250 pts` (já está correto, manter)

**2. `src/components/BrandThemePreview.tsx`**
- Já usa "pts" no histórico da carteira — sem alterações de texto necessárias
- Confirmar que o preview da tela de Ofertas (linha 301) com "R$35" no título da oferta seja atualizado para não mencionar R$: `"Corte + Barba por R$35"` → `"Corte + Barba especial"`

### Escopo
Apenas alterações de apresentação nos simuladores mobile — sem mudança em lógica de negócio, rotas ou banco de dados.

