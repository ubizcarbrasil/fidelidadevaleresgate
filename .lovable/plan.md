

## Plano: Adicionar atalhos de "Regras de Resgate" e "Produtos de Resgate" nos Links Úteis

### Mudanças em `src/components/dashboard/DashboardQuickLinks.tsx`

1. **Importar ícones**: Adicionar `Gift` e `Settings2` (ou similares) do lucide-react para os novos cards.

2. **Adicionar dois novos links** ao array `allQuickLinks`:
   - `{ label: "Regras de Resgate", path: "/regras-resgate", icon: Settings2, description: "Conversão pontos/R$ e limites" }`
   - `{ label: "Produtos de Resgate", path: "/produtos-resgate", icon: Gift, description: "Catálogo de produtos resgatáveis" }`

3. **Registrar como internos**: Adicionar "Regras de Resgate" e "Produtos de Resgate" ao `internalLabels` Set para usar navegação SPA (`navigate()`) sem recarregar a página.

### Resultado
- Dois novos cards aparecem na seção "Links Úteis" do dashboard
- Navegação instantânea sem perda de contexto
- Um arquivo alterado: `src/components/dashboard/DashboardQuickLinks.tsx`

