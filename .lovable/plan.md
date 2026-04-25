## Problema (grave de white-label)

O usuário entrou com `ubizshop@gmail.com` (brand_admin da marca **Ubiz Shop** — `ff650889…`), mas a tela carregou exibindo a logo / título / cores da marca **Ubiz Resgata** (`db15bd21…`), que pertence ao login anterior (`ubiz.tecnologia@gmail.com` / Alecio).

Sequência observada nos logs de auth:
1. Login Alecio → carrega Ubiz Resgata (marca, tema, logo, manifest).
2. Logout Alecio.
3. Login ubizshop, **na mesma aba, sem reload** → permanece com identidade visual da Ubiz Resgata.

## Causa raiz

São **quatro vazamentos** acumulados, todos no mesmo fluxo de troca de conta sem refresh:

1. **`AuthContext.signOut`** (`src/contexts/AuthContext.tsx`, linhas 196–200) só faz `supabase.auth.signOut()` e limpa `roles`. **Não chama `queryClient.clear()`**, então a query `["brand-info", brandId-antigo]` (TTL de 5 min em `useBrandName.ts`) continua servindo dados da marca anterior — incluindo `logo_url`.

2. **`BrandContext`** (`src/contexts/BrandContext.tsx`, linhas 224–237) só resolve a marca pelos `roles` quando `brand === null`. Como o estado React `brand` mantém a "Ubiz Resgata" da sessão anterior, **nunca atualiza** para a marca do novo usuário (ubizshop), mesmo após `roles` mudarem.

3. **`useBrandTheme`** (`src/hooks/useBrandTheme.ts`) escreve variáveis CSS, favicon, `document.title` e um manifest dinâmico em `document.documentElement` / `<head>`. O cleanup só roda ao **trocar `settings`** — se a marca não troca (vazamento #2), o tema antigo permanece grudado.

4. **`useBrandInfo`** (`src/hooks/useBrandName.ts`, linha 20) calcula `brandId` como `ctxBrand?.id ?? roles.find(...)?.brand_id`. Como `ctxBrand` ainda é a Ubiz Resgata, o `??` nunca cai no fallback de `roles` do novo usuário.

Resultado: logo, título, cores, favicon, manifest — tudo do tenant errado. Risco de **vazamento cross-tenant grave**.

## Solução

Mudanças cirúrgicas em 3 arquivos, sem migração SQL:

### 1. `src/contexts/AuthContext.tsx` — limpar cache no logout

- Importar `useQueryClient` do `@tanstack/react-query`.
- Em `signOut`, antes de qualquer outra coisa, chamar `queryClient.clear()` para invalidar TODAS as queries (brand-info, dashboards, etc.) que podem ter sido cacheadas pelo usuário anterior.
- Manter `setRoles([])` e `supabase.auth.signOut()`.

### 2. `src/contexts/BrandContext.tsx` — re-resolver brand quando o usuário muda

- O `useEffect` das linhas 224–237 hoje só roda quando `brand === null`. Trocar a guarda para também disparar quando o `user.id` mudar:
  - Manter um `previousUserIdRef` (via `useRef`) e, no efeito, comparar com `user?.id`.
  - Se o `user.id` for **diferente** do anterior, **forçar o re-fetch** da brand a partir dos `roles` atuais (mesmo que `brand` esteja preenchido) — e atualizar `setBrand(...)` com a nova marca, ou `setBrand(null)` quando o usuário deslogar.
- Quando `user === null` (logout), também resetar `setBrand(null)`, `setBranches([])`, `setSelectedBranchState(null)` para liberar o cleanup do `useBrandTheme`.

### 3. `src/hooks/useBrandName.ts` — não confiar cegamente em `ctxBrand`

- Trocar:
  ```ts
  const brandId = ctxBrand?.id ?? roles.find((r) => r.brand_id)?.brand_id ?? null;
  ```
  por uma lógica que **prefere o role do usuário autenticado** quando ele existe e diverge do `ctxBrand`:
  ```ts
  const userRoleBrandId = roles.find((r) => r.brand_id)?.brand_id ?? null;
  const brandId = userRoleBrandId ?? ctxBrand?.id ?? null;
  ```
  Assim, mesmo se o `BrandContext` ainda não tiver atualizado, a logo / nome no header já refletem a marca real do usuário logado. Defesa em profundidade.

## Validação

Cenário a testar manualmente:
1. Login com `ubiz.tecnologia@gmail.com` (Ubiz Resgata) — confirmar logo / título "Ubiz Resgata".
2. Sem fechar a aba, fazer logout.
3. Login com `ubizshop@gmail.com` — a logo, título, favicon e cores devem trocar **imediatamente** para "Ubiz Shop".
4. Repetir invertendo a ordem.

## Escopo

3 arquivos, sem migração SQL, sem mudança de tipos. Risco baixo: as três correções são aditivas e fortalecem o isolamento multi-tenant — nenhuma quebra de fluxo existente.
