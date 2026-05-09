## Problema

A tela `/ofertas` está caindo no fallback "Não conseguimos carregar essa página" porque o componente quebra antes mesmo de renderizar.

**Causa raiz:** O `OfertasFastTrack` em `src/App.tsx` (linhas 200-220) renderiza `PaginaUbizOfertas` **sem** o `BrandProvider` para acelerar in-app browsers. Mas o hook `useMarcaOfertas` chama `useBrand()`, que faz:

```ts
if (!context) throw new Error("useBrand must be used within BrandProvider");
```

Esse `throw` é capturado pelo `ErrorBoundary` (que agora trata `/ofertas` como rota pública) e mostra a tela amigável da segunda screenshot. Por isso o link nunca abre — independente do domínio ou brand.

## Correção

Tornar `useMarcaOfertas` independente do `BrandContext`, já que ele só é usado como uma das fontes de fallback (param URL e hostname já cobrem todos os casos públicos).

### Mudanças

1. **`src/features/ubiz_ofertas/hooks/hook_marca_ofertas.ts`**
   - Remover `import { useBrand } from "@/contexts/BrandContext"` e qualquer referência a `ctxBrand` / `ctxLoading`.
   - Manter a ordem de prioridade: `?brandId=` → hostname `app.valeresgate.com.br` (PORTAL) → `buscarBrandIdPorHostname` → erro amigável.
   - Garantir `try/catch` em torno de `buscarBrandIdPorHostname` para que falha de rede também resulte em mensagem controlada (não em throw).

2. **`src/features/ubiz_ofertas/pagina_ubiz_ofertas.tsx`**
   - Adicionar `try/catch` defensivo em qualquer ponto que possa lançar antes do primeiro render (não obrigatório, mas reduz risco no fast-track).

3. **Validação**
   - Abrir `/ofertas` no domínio publicado (`app.valeresgate.com.br/ofertas`) — deve carregar a vitrine sem cair no ErrorBoundary.
   - Abrir `/ofertas?brandId=<uuid>` em preview — deve resolver pela query string.
   - Abrir `/ofertas` em hostname desconhecido — deve mostrar a mensagem "Não foi possível identificar a marca", **não** a tela genérica de erro.

## Escopo

Mudança pequena, apenas frontend, isolada na feature `ubiz_ofertas`. Não toca em rotas, providers globais, ErrorBoundary ou DriverPanel.
