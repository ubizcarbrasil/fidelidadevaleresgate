## Plano: Branding customizado na tela /auth do portal

### Alteração

Um único arquivo: `src/pages/Auth.tsx`

### O que muda

1. **Logo e nome**: Quando `isPortalDomain`, usar `displayName = "Vale Resgate"` e `displayLogo = "/logo-vale-resgate.png"` em vez dos valores vindos do BrandContext (que resolvem para Ubiz Resgata)
  &nbsp;

### Detalhes técnicos

Usar as variáveis `isPortalDomain` (já existente na linha 27) para condicionar:

- Linhas 119-123: `src` da logo → `isPortalDomain ? "/logo-vale-resgate.png" : brandLogoUrl || "/logo-vale-resgate.png"`
- Linha 121: `alt` → usar `displayName`
- Linha 125: título → `displayName` em vez de `brandName`