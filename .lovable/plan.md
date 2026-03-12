

## Plano: Unificar "Galeria de Ícones" e "Ícones do App" em uma única página

### Conceito
Criar uma página única com Tabs que combine as duas funcionalidades:
- **Aba "Galeria"** — CRUD de ícones personalizados (atual `IconLibraryPage`)
- **Aba "Ícones do App"** — Configuração dos 25 slots do app (atual `AppIconsConfigPage`)

### Alterações

**1. `src/pages/IconLibraryPage.tsx`** — Reescrever como página unificada com `Tabs`:
- Tab "Galeria" com todo o conteúdo atual (grid de ícones + dialog de criação)
- Tab "Ícones do App" com todo o conteúdo do `AppIconsConfigPage` (slots por categoria)
- Título: "Ícones" / Descrição unificada
- O `IconPickerDialog` continua sendo usado na aba de slots

**2. `src/pages/AppIconsConfigPage.tsx`** — Transformar em redirect para `/icon-library`

**3. `src/App.tsx`** — Manter ambas as rotas mas apontar `/app-icons` para um redirect ou para o mesmo componente

**4. `src/components/consoles/BrandSidebar.tsx`** — Remover o item "Ícones do App" separado e manter apenas um item "Ícones" apontando para `/icon-library` com moduleKey combinado

**5. `src/hooks/useMenuLabels.ts`** — Atualizar o label padrão se necessário

### Resultado
Um único item no sidebar ("Ícones") leva a uma página com duas abas, eliminando a confusão de ter dois menus separados para funcionalidades relacionadas.

