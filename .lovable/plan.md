

# Eliminar o delay de 5s no clique do botão "Entrar"

## Causa raiz confirmada (reproduzida no network log)

Quando o usuário clica em **Entrar**, isso acontece, em sequência, antes do redirecionamento:

1. `POST /auth/v1/token` (login no Supabase) — ~700ms
2. `Auth.tsx` linha 71 dispara um `SELECT role FROM user_roles` **manual** apenas para decidir a rota (admin → `/`, store → `/store-panel`)
3. Em paralelo, o listener `onAuthStateChange` do `AuthContext` dispara **outro** SELECT em `user_roles` (mesmo dado, colunas diferentes)
4. O `BrandContext` (effect novo) dispara **mais um** SELECT `user_roles?brand_id=not.is.null`
5. `audit_logs INSERT` (POST) — fire-and-forget, mas concorre por banda
6. Só então o `navigate("/")` acontece, e o app começa a montar `AppLayout` com lazy-load de chunks pesados

Resultado: **2-3 segundos** entre clicar e ver qualquer mudança visual. O usuário acha que travou, clica de novo, e cada novo clique repete tudo. No log real aparecem **3 logins consecutivos** no mesmo minuto.

## Correção

### 1. `src/pages/Auth.tsx` — redirecionar imediatamente após o login

Hoje o handler espera um SELECT extra em `user_roles` antes de chamar `navigate`. Vou:

- **Remover** o SELECT manual de `user_roles` no `handleSubmit` (linhas 71-94)
- Imediatamente após `signInWithPassword` retornar sucesso, chamar `navigate("/")` (rota raiz)
- O `AppLayout` já tem o `consoleScope === "STORE_ADMIN"` que redireciona para `/store-panel` automaticamente quando os roles chegam (linha 142-144 do AppLayout)
- O `useEffect` existente (linhas 35-48) já cuida do redirecionamento quando `authRoles` chega via contexto — ele vai pegar o caso de quem já estava logado e tentou abrir `/auth`

Resultado: clique no botão → ~700ms (apenas o tempo do POST de login) → navega.

### 2. `src/contexts/AuthContext.tsx` — não bloquear redirect com auditoria nem queries

O contexto está correto em fazer fire-and-forget. Vou apenas:

- **Adiar `logAudit`** para `requestIdleCallback` (com fallback `setTimeout`) — hoje vai junto e concorre por conexão HTTP
- **Deduplicar `fetchRoles`**: se o `bootstrap` já está executando e o `onAuthStateChange` dispara `SIGNED_IN` para o **mesmo `userId`**, reutilizar o request em curso em vez de iniciar um segundo. Diferente do throttle anterior (que tinha bug), aqui só descarta o segundo se `fetchIdRef` ainda não retornou para o mesmo user, sem perder a chamada válida pós-login.

### 3. `src/contexts/BrandContext.tsx` — não duplicar a query de role

O `useEffect` que resolve brand via role (linhas 199-218) faz mais 1 SELECT em `user_roles`. Vou:

- Em vez de buscar `user_roles?brand_id=not.is.null` direto no Supabase, **ler do `roles` que o `AuthContext` já tem** (`useAuth().roles.find(r => r.brand_id)`)
- Só ir ao banco para o `fetchBrandById(brandId)` (1 query, e cacheada via `public_brands_safe`)

Isso elimina **1 round-trip por login** e garante consistência (não pode haver brand_id que `AuthContext` não viu).

### 4. (Defesa) `Auth.tsx` — desabilitar botão por 1.5s após o clique

Mesmo com tudo otimizado, vou garantir que o botão fique desabilitado até o redirect efetivamente acontecer (já está, mas vou prender também por um pequeno timeout pós-sucesso para evitar o usuário clicar duas vezes durante o navigate + lazy-load do `AppLayout`).

## Arquivos a editar

1. `src/pages/Auth.tsx` — remover SELECT manual de roles, navegar direto após login
2. `src/contexts/AuthContext.tsx` — adiar `logAudit` para idle e deduplicar `fetchRoles` por `userId` em curso
3. `src/contexts/BrandContext.tsx` — resolver brand via `roles` do `AuthContext` em vez de SELECT extra

## O que NÃO vou mexer

- ❌ Lógica de RLS, isolamento de marcas, `useBrandGuard`
- ❌ Caches já estabilizados (React Query, `useBrandInfo`, badges)
- ❌ Estrutura de rotas em `App.tsx`
- ❌ `ProtectedRoute` ou `bootState`

## Resultado esperado

- Clique em "Entrar" → **<1 segundo** até começar a ver o painel (apenas o `POST /token` do Supabase)
- Network log do login cai de **~6 requests sequenciais** para **2** (`POST /token` + `GET user_roles` em paralelo com a navegação)
- Botão "Entrar" não deixa o usuário clicar duas vezes
- Sem dependência de queries adicionais para decidir a rota inicial — quem é store_admin é redirecionado pelo `AppLayout` assim que os roles chegam (já existe)

## Risco

Baixo. As três mudanças são em arquivos isolados e revertem exatamente os pontos onde o login espera dados que o resto do app já vai buscar de qualquer jeito.

## Estimativa

~5 min.

