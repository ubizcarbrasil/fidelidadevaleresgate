

## Plano: Modo Escuro no Editor de Aparência com Preview Dual

### Problema
No modo escuro, textos como nome da marca, valores e labels ficam invisíveis porque usam cores escuras sobre fundo escuro. O empreendedor precisa configurar cores separadas para modo claro e escuro, e visualizar ambos cenários no preview.

### Solução

#### 1. Adicionar `dark_colors` ao BrandThemeEditor
- Na seção "Cores", adicionar um toggle/tabs **"Modo Claro / Modo Escuro"** para alternar entre editar `colors` e `dark_colors`.
- Quando editando `dark_colors`, mostrar os mesmos 7 campos de cor mas salvando em `theme.dark_colors`.
- Valores padrão para dark: background escuro (`222 47% 11%`), foreground branco (`0 0% 100%`), muted escuro, card escuro. Secondary/accent mantém da marca.

#### 2. Adicionar toggle Claro/Escuro no Preview
- No `BrandThemePreview`, adicionar um botão Sun/Moon ao lado dos tabs de tela para alternar entre preview claro e escuro.
- Quando em modo escuro, o preview usa `theme.dark_colors` (com fallback para defaults escuros sensatos).
- Textos de nome da marca, valores de pontos, labels ficam brancos. Destaques (nome do usuário, accent links) ficam em amarelo/laranja conforme `dark_colors.accent` ou `dark_colors.secondary`.

#### 3. Regra de cores no app real (CustomerLayout e páginas)
- No `useCustomerAccent` e nas páginas do cliente, quando `isDark`:
  - Nome da marca, textos de valores, e labels usam `white` por padrão.
  - Destaques (nome do usuário na saudação, links "Ver todos", badges) usam `dark_colors.accent` ou fallback para amarelo/laranja (`45 100% 55%`).
- Atualizar `useBrandTheme` para já aplicar `dark_colors` corretamente (o hook já suporta `dark_colors`, mas precisa garantir que foreground/background sejam aplicados).

#### 4. Defaults inteligentes para dark_colors
Se o empreendedor não configurar `dark_colors`, o sistema aplica:
- `background`: `222 47% 7%`
- `foreground`: `0 0% 100%`
- `card`: `222 47% 11%`
- `muted`: `222 47% 15%`
- `primary`/`secondary`/`accent`: herda de `colors`

### Arquivos a editar
1. **`src/hooks/useBrandTheme.ts`** — Garantir que `dark_colors` aplica foreground/background/card/muted (remover o filtro `DARK_FALLBACK_KEYS`)
2. **`src/components/BrandThemeEditor.tsx`** — Adicionar tabs Claro/Escuro na seção Cores para editar `colors` vs `dark_colors`
3. **`src/components/BrandThemePreview.tsx`** — Adicionar toggle claro/escuro; usar `dark_colors` quando escuro ativo; aplicar defaults escuros sensatos
4. **`src/components/customer/CustomerLayout.tsx`** — Garantir textos brancos no dark mode
5. **`src/pages/customer/CustomerHomePage.tsx`** — Nome/saudação branca no dark, accent em amarelo/laranja

### Escopo estimado
~5 arquivos editados, complexidade média.

