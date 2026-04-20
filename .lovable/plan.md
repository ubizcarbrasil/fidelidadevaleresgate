

# Botão "Ver Manual" na página /admin/produtos-comerciais

## O que vou fazer

Adicionar um botão **"Ver Manual"** no header da página de Produtos Comerciais que, ao clicar, abre um **Dialog modal** exibindo os 2 manuais da seção Produtos Comerciais (o manual base + o exemplo prático "Vale Resgate Motorista Premium") sem o usuário sair da tela.

## Componentes envolvidos

### 1. Componente novo (reutilizável)
**`src/compartilhados/components/manual_modal.tsx`**
- Dialog do shadcn (sobreposição modal)
- Recebe via prop `manualIds: string[]` — array de IDs dos manuais a exibir
- Busca os manuais nos `gruposManuais` (em `dados_manuais.ts`)
- Renderiza cada manual usando o **`ManualRenderer`** existente (mesmo componente da página /manuais → consistência visual 100%)
- Header do modal: ícone BookOpen + título "Manuais — Produtos Comerciais" + botão fechar
- Scroll interno (`max-h-[85vh] overflow-y-auto`) para conteúdo longo
- Estado local de qual manual está aberto (mesmo padrão da AbaManual)

### 2. Botão no header da página
**`src/pages/admin/ProdutosComerciaisPage.tsx`** (ou nome equivalente — vou localizar primeiro)
- Adicionar botão `<Button variant="outline" size="sm">` com ícone `BookOpen` + texto "Ver Manual"
- Posicionado ao lado do botão "Criar Produto" (canto direito do header)
- Mobile: mantém só o ícone (`sm:` para mostrar texto em telas maiores) — economia de espaço
- Estado local `manualOpen, setManualOpen` que controla o `<ManualModal open={...} onOpenChange={...} />`

## Arquivos editados/criados

| Arquivo | Ação | Mudança |
|---|---|---|
| `src/compartilhados/components/manual_modal.tsx` | **NOVO** | Componente reutilizável de modal de manual |
| `src/pages/admin/ProdutosComerciaisPage.tsx` (caminho real a confirmar) | Editar | Adicionar botão + estado + render do modal |

## Por que reutilizar `ManualRenderer`?

- Já tem todas as 4 seções (O que é, Como ativar, Passo a passo, Dicas)
- Já tem o botão "Ir para esta página" (que dentro do modal pode ser útil quando o manual aponta para OUTRA rota)
- Visual consistente com /manuais — usuário aprende uma vez, reconhece em todo lugar
- Zero duplicação de código

## Comportamento esperado

1. Usuário entra em `/admin/produtos-comerciais` 
2. Vê no canto direito do header: `[📖 Ver Manual] [+ Criar Produto]`
3. Clica em "Ver Manual" → modal abre centralizado, ocupando até 85% da altura
4. Vê os 2 manuais da seção (manual base + exemplo prático Vale Resgate Motorista Premium) listados, ambos colapsados
5. Clica em qualquer um → expande inline (passo a passo, valores sugeridos, dicas)
6. Pode fechar com X, ESC ou clicando fora — volta exatamente onde estava
7. Mobile (430px): modal ocupa quase toda a tela com scroll interno suave

## Reutilização futura

O componente `ManualModal` fica genérico — qualquer outra página pode adicionar seu próprio botão "Ver Manual" passando os IDs relevantes. Ex: a página de Cidades poderia abrir os manuais de "Cidades (Branches)" e "Minhas Cidades" sem duplicação de código.

## Risco e rollback

- **Risco zero**: novo componente isolado + uma única edição cosmética no header
- **Sem mudanças** em lógica de negócio, banco, RLS, edge functions
- **Rollback**: deletar `manual_modal.tsx` e reverter o header da página

## Estimativa

~5 min. `npx tsc --noEmit` esperado limpo.

