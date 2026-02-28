

## Modo Preview do App do Cliente

Adicionar uma rota `/customer-preview` que carrega o app do cliente diretamente no ambiente de desenvolvimento, buscando a primeira brand ativa do banco e simulando o contexto white-label.

### Abordagem

Criar um componente `CustomerPreviewPage` que:
1. Busca a primeira brand ativa do banco (`brands` WHERE `is_active = true` LIMIT 1)
2. Busca as branches dessa brand
3. Injeta esses dados num `BrandContext` override, forçando `isWhiteLabel = true`
4. Renderiza o `WhiteLabelLayout` normalmente

### Alterações

| Ação | Arquivo |
|------|---------|
| Criar | `src/pages/CustomerPreviewPage.tsx` — componente que resolve brand/branches do banco e renderiza o WhiteLabelLayout dentro de um BrandContext com override |
| Editar | `src/contexts/BrandContext.tsx` — exportar um `BrandProviderOverride` que aceita brand/branches como props (sem resolução por domínio) |
| Editar | `src/App.tsx` — adicionar rota `/customer-preview` antes das rotas protegidas |

### Detalhes técnicos

**`BrandProviderOverride`** — novo provider que recebe `brand` e `branches` como props, reutiliza toda a lógica de seleção de branch/geolocation/tema, mas pula a resolução por domínio e força `isWhiteLabel = true`.

**`CustomerPreviewPage`** — faz `useEffect` para buscar a primeira brand ativa + suas branches, mostra loading enquanto carrega, depois renderiza `<BrandProviderOverride><WhiteLabelLayout /></BrandProviderOverride>`.

**Rota** — `/customer-preview` fica fora do `ProtectedRoute` para permitir testar o fluxo completo de auth do cliente. Brands existentes no banco: "Marca Teste" e "Brand Premium".

