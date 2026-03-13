

## Plano: Posicionar banner em seção ativa específica

### Problema
Atualmente, ao criar um banner, ele é vinculado automaticamente à primeira seção `BANNER_CAROUSEL` encontrada (ou cria uma nova). O usuário quer escolher **em qual seção ativa** o banner será exibido.

### Alterações

**1. `src/pages/BannerManagerPage.tsx`**

- Adicionar query para buscar todas as `brand_sections` ativas da marca (join com `section_templates` para mostrar nome/tipo)
- Adicionar campo `brand_section_id` ao formulário com um `<Select>` listando as seções ativas (ex: "Carrossel de Banners (posição 1)", "Selecionados para você (posição 3)")
- Remover a lógica de auto-criação de `BANNER_CAROUSEL` do `createMutation` — usar o `brand_section_id` selecionado pelo usuário
- No card de cada banner existente, exibir em qual seção ele está posicionado (badge ou texto)
- Permitir alterar a seção de um banner existente via mutation de update

**2. Detalhes da UI**

- O Select mostra: `[título da seção ou tipo] — posição X` para cada seção ativa
- Opção "Sem seção (global)" para banners que aparecem em qualquer carrossel
- Se não houver seções ativas, mostrar hint para criar uma no Construtor de Páginas

### Dados já disponíveis
- `banner_schedules.brand_section_id` já existe como FK nullable para `brand_sections`
- `brand_sections` já tem `title`, `order_index`, `is_enabled` e join com `section_templates`

### Resultado
O operador escolhe visualmente onde posicionar cada banner entre as seções configuradas da home.

