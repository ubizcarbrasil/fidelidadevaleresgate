

## Plano: Categoria virtual "Novas Ofertas" com expiração de 48h

### Conceito
Criar uma categoria virtual "Novas Ofertas" que aparece **sempre em primeiro lugar** (antes de Eletrônicos), com **3 linhas** de produtos. Não é uma categoria real no banco — é montada no frontend filtrando deals criados nas últimas 48 horas. Deals permanecem em sua categoria original simultaneamente.

### Mudanças

**1. Queries — adicionar `created_at` ao select**

Arquivos: `DriverMarketplace.tsx`, `AchadinhoSection.tsx`

- Adicionar `created_at` no `.select(...)` das queries de `affiliate_deals`
- Adicionar `created_at` na interface `AffiliateDeal` em ambos os arquivos

**2. Categoria virtual "Novas Ofertas" no Driver**

Arquivo: `src/components/driver/DriverMarketplace.tsx`

- Após processar as categorias reais, criar uma categoria virtual:
  - `id: "__new_offers__"`, `name: "Novas Ofertas"`, `icon_name: "Sparkles"`, `color: "#f59e0b"`
- Filtrar todos os deals com `created_at` dentro das últimas 48h
- Inserir essa categoria como **primeira** no array de `viableCategories`
- No `categoryLayout`, forçar `rows: 3` e `order: -1` para essa categoria virtual
- Deals novos aparecem duplicados: na "Novas Ofertas" E na sua categoria original

**3. Categoria virtual "Novas Ofertas" no Customer (Achadinhos)**

Arquivo: `src/components/customer/AchadinhoSection.tsx`

- Mesma lógica: adicionar `created_at` ao select e interface
- Criar categoria virtual com 3 linhas, posição 0
- Duplicar deals recentes nessa categoria sem removê-los da original

**4. Regras de exibição**
- A estrela (`is_featured`) continua funcionando normalmente dentro de cada categoria real
- Na "Novas Ofertas", ordenar por `created_at DESC` (mais recentes primeiro)
- Se não houver deals com menos de 48h, a categoria "Novas Ofertas" não aparece
- Mínimo de 3 deals para a categoria aparecer (regra existente)

### O que NÃO muda
- Nenhuma tabela/migration no banco de dados
- Nenhuma categoria real criada no `affiliate_deal_categories`
- Estrela e `order_index` continuam funcionando nas categorias reais
- Não afeta página de categoria individual nem busca

