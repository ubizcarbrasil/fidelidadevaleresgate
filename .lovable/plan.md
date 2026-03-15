

## Plano: Exibir logo do empreendedor nas telas do lojista

### Problema
As telas de cadastro de lojista, login e painel do lojista não exibem a logo da marca (empreendedor). Exibem apenas a logo genérica da plataforma ou nenhuma logo.

### Mudanças

**1. `src/pages/StoreRegistrationWizard.tsx` — Adicionar logo da marca no header**

O componente já importa `useBrand()`. Basta extrair `brand` e `theme` para exibir a logo da marca acima do indicador de etapas:
- Mostrar `theme?.logo_url` ou `brand?.logo_url` centralizada no topo
- Fallback: primeira letra do nome da marca em um badge estilizado
- Também exibir o nome da marca abaixo da logo

**2. `src/pages/Auth.tsx` — Exibir logo da marca quando disponível**

Atualmente usa `PlatformLogo` hardcoded. Precisa:
- Importar `useBrand()` (ou `useBrandInfo()`)
- Se houver `brandLogoUrl`, exibir a logo da marca em vez do `PlatformLogo`
- Se houver `brandName`, exibir o nome da marca em vez de "Vale Resgate"
- Manter `PlatformLogo` como fallback quando não há marca resolvida (acesso direto pela plataforma)

**3. `src/pages/StoreOwnerPanel.tsx` — Adicionar logo da marca no header**

O header já mostra a logo da loja. Adicionar a logo da marca ao lado ou como subtítulo:
- Buscar a marca via `useBrand()` ou query direta à tabela `brands` usando `store.brand_id`
- Exibir um badge pequeno com a logo da marca ao lado do nome da loja
- Exemplo: `[Logo Marca] Marca Nome > [Logo Loja] Nome da Loja`

### Arquivos

| Arquivo | Escopo |
|---|---|
| `src/pages/StoreRegistrationWizard.tsx` | Adicionar logo + nome da marca no header |
| `src/pages/Auth.tsx` | Trocar PlatformLogo por logo da marca quando disponível |
| `src/pages/StoreOwnerPanel.tsx` | Exibir logo da marca no header junto à loja |

### Regras
- Zero alteração em lógica de negócio
- Fallback gracioso quando não há logo da marca
- Manter PlatformLogo como fallback genérico

