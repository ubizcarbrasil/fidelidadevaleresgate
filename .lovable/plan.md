

## Plano: Tornar `/driver` acessível em domínios white-label

### Problema

Quando o link compartilhado é aberto no domínio publicado (`fidelidadevaleresgate.lovable.app`), o `BrandContext` detecta white-label e renderiza `WhiteLabelLayout` em vez de `AppRoutes`. A rota `/driver` nunca é alcançada — o usuário cai no fluxo do cliente (que exige login).

### Correção

**`src/App.tsx`** — função `AppContent` (linha ~258)

Adicionar bypass para `/driver`, igual ao que já existe para `/:slug/parceiro`:

1. Detectar se `location.pathname === "/driver"` (ou começa com `/driver`)
2. Se sim, renderizar diretamente o `DriverPanelPage` sem passar pelo `WhiteLabelLayout`

```text
AppContent()
  ├── isPartnerLanding? → rota parceiro (já existe)
  ├── isDriverPanel? → rota /driver (NOVO)
  ├── loading? → spinner
  ├── isWhiteLabel? → WhiteLabelLayout
  └── default → AppRoutes
```

### Arquivo
- `src/App.tsx` — adicionar bypass para `/driver` antes do check de white-label

