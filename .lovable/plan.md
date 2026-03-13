

## Diagnóstico

Analisei todo o código e confirmo: **todas as alterações estão salvas corretamente nos arquivos**. O `CustomerHomePage.tsx` tem o greeting compacto, badge de pontos, categorias e geolocalização. O `HomeSectionsRenderer.tsx` tem as props `renderBannersOnly`/`skipBanners`.

**O problema é que você está acessando a URL publicada** (`preview--fidelidadevaleresgate.lovable.app`), que é diferente do preview do editor. A URL publicada precisa de um **Publish → Update** para refletir as mudanças.

Além disso, nos screenshots vejo o título "Resgate na cidade" aparecendo duplicado — isso indica que podem existir duas `brand_sections` com o mesmo título no banco de dados.

### Problemas identificados

| Problema | Causa |
|----------|-------|
| Layout antigo na URL publicada | Falta clicar em **Publish → Update** no editor |
| Cache do PWA servindo bundle antigo | Service Worker mantendo versão antiga |
| "Resgate na cidade" duplicado | Possível duplicação de seções no banco |

### Plano de ação

1. **Forçar invalidação de cache no PWA** — Adicionar um version stamp no `index.html` via meta tag que o SW verifica, forçando reload quando há nova versão.

2. **Corrigir duplicação de seções** — Adicionar deduplicação por título no `HomeSectionsRenderer` para evitar seções repetidas visualmente.

3. **Orientação ao usuário** — Após implementar, você precisa:
   - Clicar em **Publish → Update** no canto superior direito do editor
   - No celular, abrir o app e puxar para baixo para forçar reload
   - Ou limpar dados do site nas configurações do navegador

### Arquivos a editar

| Arquivo | Mudança |
|---------|---------|
| `src/components/HomeSectionsRenderer.tsx` | Adicionar deduplicação de seções por título |
| `index.html` | Adicionar meta tag de versão para cache busting |

