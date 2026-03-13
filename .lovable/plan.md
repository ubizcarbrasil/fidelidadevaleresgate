

## Diagnóstico: App do cliente mostrando versão antiga

### Análise

Verifiquei todos os arquivos alterados e o código novo está corretamente salvo:
- `CustomerHomePage.tsx` — layout redesenhado com greeting compacto, badge de pontos, categorias
- `SegmentNavSection.tsx` — usando taxonomy_categories com visual escuro
- `HomeSectionsRenderer.tsx` — com props `renderBannersOnly`/`skipBanners` e cards redesenhados
- `CategoryGridOverlay.tsx` e `CategoryStoresOverlay.tsx` — criados corretamente

**O problema não é no código.** Possíveis causas:

1. **Você está visualizando pelo domínio publicado** (`fidelidadevaleresgate.lovable.app`) — as alterações de frontend só aparecem no domínio publicado após clicar em "Update" no botão Publish. O preview (`id-preview--...lovable.app`) mostra a versão mais recente automaticamente.

2. **Cache do PWA** — o app tem Service Worker (PWA) que pode estar servindo uma versão antiga em cache. Precisa forçar atualização.

3. **Rota errada** — sua sessão atual está em `/index` (dashboard admin), não no app do cliente.

### Plano de ação

1. **Limpar cache do SW no preview**: Adicionar lógica no `main.tsx` para forçar `skipWaiting` e `clients.claim` no Service Worker ao detectar domínio de preview, garantindo que o bundle mais recente seja carregado.

2. **Republicar o frontend**: Se está acessando pelo domínio publicado, basta clicar em **Publish → Update** no canto superior direito do editor para que as mudanças apareçam.

3. **Acessar corretamente**: Para testar o app do cliente no preview, acesse `/customer-preview` no preview URL (ex: `https://id-preview--3ff47979-b8b4-4666-bfef-7987c2d119c3.lovable.app/customer-preview?brandId=SEU_BRAND_ID`).

### Arquivo a editar

| Arquivo | Ação |
|---------|------|
| `src/main.tsx` | Adicionar limpeza agressiva de cache do SW para forçar atualização no preview |

Nenhuma mudança de layout é necessária — o código novo já está em vigor.

