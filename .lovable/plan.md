
## Corrigir "Novas Ofertas" vazia ao clicar "Ver todos"

### Problema

"Novas Ofertas" é uma categoria virtual criada no frontend (id `__new_offers__`) que agrega deals criados nas últimas 48h. Quando o usuário clica "Ver todos", o sistema abre `DriverCategoryPage` ou `AchadinhoCategoryPage` que fazem `.eq("category_id", "__new_offers__")` no banco — retornando 0 resultados, pois nenhum deal tem esse category_id.

### Correção

Alterar as queries em ambas as páginas de categoria para detectar o id virtual e usar filtro por recência em vez de `category_id`:

**Arquivo 1: `src/components/driver/DriverCategoryPage.tsx`**
- Na queryFn (linha ~40-51): se `category.id === "__new_offers__"`, remover `.eq("category_id", ...)` e adicionar `.gte("created_at", cutoff48h)` + ordenar por `created_at desc`
- Manter o restante do comportamento (search, banners, etc.)

**Arquivo 2: `src/components/customer/AchadinhoCategoryPage.tsx`**
- Mesma lógica na queryFn (linha ~67-79): detectar id virtual e usar filtro de recência

Ambos os arquivos já definem a constante de 48h em seus respectivos componentes pai — basta replicar a mesma lógica de filtro.

### O que NÃO será alterado
- Nenhuma mudança na lógica de construção da categoria virtual no `AchadinhoSection` ou `DriverMarketplace`
- Nenhuma mudança em guards, auth, providers ou bootstrap
- Banners e busca continuam funcionando normalmente
