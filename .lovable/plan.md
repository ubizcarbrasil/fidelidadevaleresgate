

## Plano: Unificar fallback de logo com PlatformLogo

### Escopo
Apenas o Problema 1 — logo fallback. **Não** alterar `DriverPanelPage.tsx`.

### Arquivos a alterar

| Arquivo | Mudança |
|---------|---------|
| `BrandSidebar.tsx` (linhas 336-342) | Trocar bloco `{brandLogoUrl ? <img> : <div>}` por `<PlatformLogo src={brandLogoUrl} alt={brandName} className="h-8 w-8 rounded-lg" fallbackLabel={brandNameInitial} />` |
| `StoreOwnerPanel.tsx` (linhas 242-246) | Idem — usar `<PlatformLogo>` no header do painel |
| `StoreRegistrationWizard.tsx` (linhas 476-479) | Idem — usar `<PlatformLogo>` no logo do wizard |
| `Dashboard.tsx` (linhas 121-125) | Idem — usar `<PlatformLogo>` no header do dashboard |

### O que NÃO muda
- `Auth.tsx` — já usa fallback correto (`/logo-vale-resgate.png`)
- `BrandSettingsPage.tsx` — já usa `<PlatformLogo>`
- `TenantSidebar.tsx` — usa ícone genérico `Building2`, não precisa de logo de brand
- `DriverPanelPage.tsx` — fora do escopo

### Resultado
Todas as telas que exibem logo de brand passarão a usar `PlatformLogo`, que já tem fallback embutido para `/logo-vale-resgate.png`. Brands sem logo personalizada mostrarão a logo da plataforma em vez de ícones genéricos ou iniciais.

