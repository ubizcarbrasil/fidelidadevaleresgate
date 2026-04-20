

# Ocultar UUID no cabeçalho mobile (mostrar nome amigável)

## Diagnóstico

No topo da tela mobile aparece `4d87e2e5-a1b4-40f7-b686-738adf5ca981` — esse é o `id` da cidade (branch) que está na URL `/brand-branches/4d87e2e5-...`.

O cabeçalho mobile (`src/components/AppLayout.tsx`, linhas 209-213) mostra o **último item do breadcrumb**. A função `useBreadcrumbs` (linhas 61-74) tem um fallback genérico que, quando não encontra o segmento no `routeLabels`, simplesmente capitaliza o texto da URL — e como o último segmento é um UUID, ele aparece cru.

A página em si já tem o próprio título grande **"Editar Cidade"**, então o UUID no topo é puro ruído visual.

## Ajuste

Arquivo: `src/components/AppLayout.tsx`

### 1. Detectar UUID/IDs no helper `useBreadcrumbs` (linhas 61-74)

Adicionar:
- Regex para detectar UUID v4 (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`)
- Detecção de `new` como segmento (já é caso de "criar novo")

Quando o último segmento da URL for:
- **UUID** → substituir o label por **"Editar"** (ex: `/brand-branches/UUID` → breadcrumb final = "Editar")
- **`new`** → substituir por **"Novo"**

E manter o segmento anterior (ex: "Cidades") como contexto, então o breadcrumb fica: `Início › Cidades › Editar`.

### 2. Adicionar rótulos faltantes em `routeLabels` (linhas 39-59)

Incluir as rotas de cidades que não estão mapeadas:
- `/brand-branches`: "Cidades"
- `/brand-branches/new`: "Nova Cidade"

(Já existem `/branches` mas não `/brand-branches`, que é a rota que o usuário está usando.)

### 3. Resultado no header mobile

Antes (atual):
```
4d87e2e5-a1b4-40f7-b686-738adf5ca981
```

Depois:
```
Editar
```

E no breadcrumb desktop (md+):
```
Início › Cidades › Editar
```

## O que NÃO vou mexer

- ❌ A URL em si (continua com o UUID, é necessária pro roteamento)
- ❌ O título grande da página ("Editar Cidade") — já está correto
- ❌ Outras telas, banco, edge functions

## Risco

Zero. É só ajustar o helper `useBreadcrumbs` e adicionar 2 entradas no `routeLabels`. Aplica-se automaticamente a qualquer rota com UUID/`new` no final (cidades, marcas, ofertas, parceiros, etc.) — bonus de consistência geral.

## Estimativa

~2 min.

