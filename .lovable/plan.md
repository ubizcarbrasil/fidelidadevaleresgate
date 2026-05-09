## Problema

Após o Publish, `/ofertas` continua mostrando "Não conseguimos carregar essa página". O console do domínio `app.valeresgate.com.br` revela o erro real:

```
Error: useAuth must be used within AuthProvider
  at xe (pagina_ubiz_ofertas...)
```

## Causa raiz

O `OfertasFastTrack` em `src/App.tsx` renderiza `PaginaUbizOfertas` **sem** `AuthProvider` (e sem `BrandProvider`) para acelerar o carregamento em in-app browsers. Mas o componente `PortaoAcessoOfertas` (`src/features/ubiz_ofertas/components/portao_acesso_ofertas.tsx` linha 26) chama `useAuth()` incondicionalmente. Como hooks rodam antes do early-return `if (modo === "public") return children`, o erro é lançado mesmo na configuração padrão (modo público).

A correção anterior removeu a dependência de `useBrand`, mas `useAuth` ficou esquecida no portão de acesso.

## Correção

Tornar `PortaoAcessoOfertas` resiliente à ausência do `AuthProvider`, lendo o contexto de forma defensiva — quando não houver provider, tratar como visitante anônimo (sem `user`, `loading=false`). Modos `authenticated` e `whitelist` continuam funcionando quando o provider existe; em fast-track, modo público segue funcionando normalmente.

### Mudanças

1. **`src/features/ubiz_ofertas/components/portao_acesso_ofertas.tsx`**
   - Remover `import { useAuth } from "@/contexts/AuthContext"`.
   - Importar `AuthContext` diretamente e usar `useContext(AuthContext)`.
   - Se o contexto for `undefined` (sem provider), assumir `{ user: null, loading: false }`.
   - Manter toda a lógica atual de `public` / `authenticated` / `whitelist`.

2. **Validação**
   - `app.valeresgate.com.br/ofertas` deve carregar a vitrine sem cair no ErrorBoundary.
   - Console deve ficar limpo (sem o erro de `useAuth`).
   - Preview com brand em modo `authenticated` ou `whitelist` (com AuthProvider montado) continua exigindo login/whitelist como antes.

## Escopo

Mudança mínima, apenas frontend, em um único arquivo da feature `ubiz_ofertas`. Não toca em rotas, providers globais, ErrorBoundary nem em outras features.
