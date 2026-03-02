

## Problema

O nome **"Vale Resgate"** está hardcoded em dois lugares:

1. **`src/components/consoles/BrandSidebar.tsx`** (linha 115) — header da sidebar mostra "Vale Resgate" fixo
2. **`src/components/AppLayout.tsx`** (linha 43) — header superior mostra "Vale Resgate — Painel do Empreendedor"

Quando o usuário `teste-ubizresgata@teste.com` (brand_admin da marca "Ubiz Resgata") acessa o painel, deveria ver o nome da sua marca, não "Vale Resgate".

## Solução

Usar o `useBrand()` do `BrandContext` para obter o nome da marca dinamicamente. Como o `BrandContext` não resolve marca em ambientes de preview (lovable.app), precisamos de um fallback: buscar o nome da marca a partir do `brand_id` presente nos `roles` do usuário.

### Alterações

1. **`BrandSidebar.tsx`** — Importar `useBrand()` e obter `brand.name`. Adicionar fallback com query ao banco caso `brand` seja null (cenário preview). Substituir o texto fixo "Vale Resgate" por `brandName`.

2. **`AppLayout.tsx`** — Mesma lógica: usar `useBrand()` para obter o nome da marca e substituir "Vale Resgate" no header superior por um nome dinâmico. Para o console ROOT, usar "Plataforma" ou similar como fallback.

### Detalhes técnicos

- No `BrandSidebar`, adicionar um `useState`/`useEffect` que, quando `brand` do context é null, busca o nome da marca via `supabase.from("brands").select("name").eq("id", currentBrandId)` usando o `brand_id` dos roles do AuthContext.
- No `AppLayout`, a mesma lógica se aplica — ou extrair para um hook compartilhado `useBrandName()` que retorna o nome resolvido.
- Fallback final: mostrar "Carregando..." ou string vazia enquanto o nome não está disponível.

