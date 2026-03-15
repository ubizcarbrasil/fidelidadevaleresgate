

## Plano: Substituir logo da plataforma pela imagem do porquinho

A imagem enviada (porquinho amarelo em fundo cyan) será usada como logo padrão da plataforma em todos os pontos onde aparece.

### Mudanças

1. **Copiar imagem** para `public/logo-vale-resgate.png` (substituindo o `.jpeg` atual)
2. **Atualizar `PlatformLogo.tsx`** — trocar default de `"/logo-vale-resgate.jpeg"` para `"/logo-vale-resgate.png"`
3. **Atualizar `public/favicon.ico`** e **PWA icons** (`pwa-192x192.png`, `pwa-512x512.png`) com a mesma imagem para consistência no navegador e tela inicial
4. **Atualizar `index.html`** se referenciar o favicon antigo
5. **Atualizar `manifest.json`** — já aponta para `pwa-192x192.png` / `pwa-512x512.png`, então basta substituir os arquivos

Como `PlatformLogo` é o componente centralizado usado em todos os consoles (Root, Branch sidebars), Auth, Landing Page, Footer e Trial — a troca do default propaga automaticamente para todos os lugares.

### Arquivos

| Arquivo | Ação |
|---|---|
| `public/logo-vale-resgate.png` | Copiar imagem do upload |
| `public/pwa-192x192.png` | Substituir com a mesma imagem |
| `public/pwa-512x512.png` | Substituir com a mesma imagem |
| `src/components/PlatformLogo.tsx` | Trocar extensão `.jpeg` → `.png` |

