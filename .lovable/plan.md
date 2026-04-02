

# Otimização de Performance — Carregamento Rápido

## Diagnóstico
O app fica travado em "preparando ambiente…" porque o fluxo de boot é sequencial e pesado:

1. `index.html` → `import("/src/main.tsx")` (carrega bundle principal)
2. `main.tsx` → renderiza shell → `import("./App.tsx")` (**segundo round-trip de rede**)
3. App.tsx importa diretamente: AuthContext, BrandContext, AppLayout, ProtectedRoute, NotFound, etc.
4. AuthContext faz `getSession()` + `fetchRoles()` sequencialmente (timeout de 8s)
5. BrandContext espera AuthContext terminar, depois faz resolve de domínio + branches + geolocation
6. Só depois disso o conteúdo aparece

**Problemas principais:**
- Double dynamic import (`main.tsx` → `App.tsx`) adiciona latência desnecessária
- Auth e Brand são sequenciais quando poderiam ser paralelos para rotas públicas
- AppLayout importa 5 sidebars + CommandPalette + ContextualHelpDrawer **estaticamente** — tudo vai no bundle inicial
- Timeouts muito longos (8s auth, 5s brand, 18s bootstrap)
- Geolocation bloqueia rendering se branches > 1

## Plano de Otimização

### 1. Eliminar double dynamic import em `main.tsx`
Importar App diretamente em vez de usar `import("./App.tsx")` dinâmico. O Vite já faz code-splitting via lazy routes — o import dinâmico adicional só atrasa.

**Arquivo:** `src/main.tsx`

### 2. Lazy-load sidebars e componentes pesados do AppLayout
Converter imports estáticos de sidebars (RootSidebar, TenantSidebar, BrandSidebar, BranchSidebar, OperatorSidebar), CommandPalette, ContextualHelpDrawer e ApiKeyOnboardingDialog para `lazyWithRetry`.

**Arquivo:** `src/components/AppLayout.tsx`

### 3. Reduzir timeouts de segurança
- Auth timeout: 8s → 5s
- Brand safety timeout: 5s → 3s
- Bootstrap overlay: 18s → 10s

**Arquivos:** `src/contexts/AuthContext.tsx`, `src/contexts/BrandContext.tsx`, `index.html`

### 4. Defer geolocation para após render inicial
Mover a detecção automática de branch por geolocation para executar **após** o primeiro render, em vez de bloquear o carregamento.

**Arquivo:** `src/contexts/BrandContext.tsx`

### 5. Parallelizar Auth + Brand para caminhos locais
No BrandContext, quando `isLocal`, a resolução termina imediatamente. Garantir que não há espera desnecessária do AuthContext para começar.

**Arquivo:** `src/contexts/BrandContext.tsx`

## Impacto Esperado
- Eliminação de 1 round-trip de rede (double import)
- Redução do bundle inicial (sidebars lazy-loaded)
- Primeiro conteúdo visível 2-3s mais rápido
- Timeouts mais agressivos evitam tela travada

## Arquivos a Modificar

| Arquivo | Alteração |
|---|---|
| `src/main.tsx` | Remover import dinâmico de App |
| `src/components/AppLayout.tsx` | Lazy-load sidebars e componentes pesados |
| `src/contexts/AuthContext.tsx` | Reduzir timeout 8s→5s |
| `src/contexts/BrandContext.tsx` | Reduzir timeout 5s→3s, defer geolocation |
| `index.html` | Reduzir timeout bootstrap 18s→10s |

