## Objetivo

Adicionar **paginação simples** (não virtual) na `TabelaModulosOrigem` da página de Diagnóstico de Marca, melhorando performance e legibilidade quando uma marca tiver muitos módulos ativos.

**Por que paginação simples e não virtual:**
- O universo total de `module_definitions` da plataforma é da ordem de dezenas (não milhares).
- Paginação simples mantém a UX consistente com o resto do projeto (não há `react-virtual` instalado), evita dependências novas e respeita a regra de "reutilizar antes de criar".
- Render por página de 20 itens cobre 99% dos casos com 1 única página, e ainda assim ganhamos um cap de DOM defensivo.

---

## Mudanças

### 1. Novo componente `paginacao_tabela.tsx` (compartilhado)

Como hoje **não existe** um componente de paginação reutilizável no projeto (só os primitivos `pagination.tsx` do shadcn), criar:

```text
src/compartilhados/components/paginacao_tabela.tsx
```

Componente "burro" que recebe:
- `paginaAtual: number`
- `totalPaginas: number`
- `totalItens: number`
- `itensPorPagina: number`
- `onMudarPagina: (p: number) => void`

Renderiza usando os primitivos shadcn já existentes (`Pagination`, `PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationPrevious`, `PaginationNext`, `PaginationEllipsis`) com:
- Texto resumo "Mostrando X–Y de N"
- Botões anterior/próximo desabilitados nas bordas
- Janela deslizante de 5 páginas com `…` quando necessário
- Esconde a si mesmo quando `totalPaginas <= 1`

Fica em `compartilhados/` porque será reutilizável em qualquer outra tabela futura (Branches, Tenants, Subscriptions etc.).

### 2. Novo hook `hook_paginacao.ts` (compartilhado)

```text
src/compartilhados/hooks/hook_paginacao.ts
```

Hook puro que recebe `{ itens: T[], itensPorPagina?: number }` e devolve `{ paginaAtual, totalPaginas, itensVisiveis, irParaPagina, resetar }`. Default 20 itens por página.

Inclui auto-reset para a página 1 quando o array de entrada muda (ex.: após filtro/busca), evitando o bug clássico de "página 5 vazia depois de filtrar".

### 3. Ajuste em `tabela_modulos_origem.tsx`

- Manter a lógica de busca + filtro de origem como está (paginação opera sobre o `filtrados`).
- Plugar o `useHookPaginacao(filtrados, { itensPorPagina: 20 })`.
- Renderizar apenas `itensVisiveis` no `TableBody`.
- Renderizar `<PaginacaoTabela />` logo abaixo da tabela, dentro do `Card`.
- Adicionar contador "X módulos no total" no canto direito do cabeçalho de filtros (já que com paginação o usuário perde a noção do volume bruto).

Sem mudança em tipos, services, hooks de dados ou na rota — é puramente de apresentação.

### 4. Teste rápido

Adicionar 1 teste novo em arquivo existente do diagnóstico (ou criar `__tests__/paginacao_tabela.test.tsx` se não houver) cobrindo:
- Janela de 20 itens visíveis
- Reset para página 1 após busca
- `totalPaginas` = `ceil(total / 20)`

---

## Detalhes técnicos

- **Sem novas dependências**: usa exclusivamente shadcn `pagination` já presente em `components/ui/pagination.tsx`.
- **Acessibilidade**: os primitivos shadcn já trazem `aria-label` e `aria-current="page"` corretos.
- **Performance**: corte do array antes do `.map()` no `TableBody` reduz o DOM para ≤20 linhas por render, eliminando jank em marcas com 60+ módulos quando combinado com filtros.
- **Estado**: `paginaAtual` vive dentro do hook (estado local), nada precisa subir para o `pagina_diagnostico_marca.tsx`.
- **Nomenclatura**: tudo em `snake_case` português conforme regra do workspace (`paginacao_tabela.tsx`, `hook_paginacao.ts`, `irParaPagina`, `itensVisiveis`).
- **Design system**: usa `bg-card`, `text-muted-foreground`, `border-border` — sem cores hardcoded. Os primitivos shadcn já respeitam os tokens semânticos.
- **Reuso futuro**: o par `PaginacaoTabela` + `useHookPaginacao` fica pronto para ser plugado em `Brands.tsx`, `Branches.tsx`, `Tenants.tsx` e qualquer listagem futura.

---

## Arquivos

**Criados:**
- `src/compartilhados/components/paginacao_tabela.tsx`
- `src/compartilhados/hooks/hook_paginacao.ts`
- `src/compartilhados/hooks/__tests__/hook_paginacao.test.ts`

**Editados:**
- `src/features/diagnostico_marca/components/tabela_modulos_origem.tsx`

Nenhuma mudança em banco, edge functions, rotas ou contratos.
