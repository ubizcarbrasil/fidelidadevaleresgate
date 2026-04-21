

# Bug: dialog "Nova Oferta" não rola e não tem botão de voltar no mobile

## Diagnóstico

Em `src/pages/OffersPage.tsx` (linha 115), o `DialogContent` é aberto com `className="max-w-lg w-[calc(100vw-2rem)]"` — **sem altura máxima e sem scroll**.

Resultado no viewport mobile (430×761):
- O conteúdo do form (8 campos + botão Salvar) é mais alto que a tela
- O `DialogContent` é centralizado vertical com `top-[50%] translate-y-[-50%]`, então tanto o topo (header + X de fechar) quanto o rodapé (botão Salvar) **saem da viewport**
- Usuário fica preso na tela: não rola, não enxerga o X, não tem botão de voltar

O mesmo padrão pode existir em outros dialogs do app, mas o pedido é pontual nesta tela.

## Correção (mínima e cirúrgica)

### `src/pages/OffersPage.tsx` — ajustar `DialogContent` e estrutura interna

1. Adicionar `max-h-[90vh]` + layout em coluna no `DialogContent`, separando header fixo / corpo rolável / rodapé fixo:

```tsx
<DialogContent className="max-w-lg w-[calc(100vw-2rem)] max-h-[90vh] p-0 gap-0 flex flex-col">
  <DialogHeader className="px-6 pt-6 pb-3 border-b shrink-0">
    <DialogTitle>{editId ? "Editar Oferta" : "Nova Oferta"}</DialogTitle>
  </DialogHeader>

  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
    {/* todos os campos: Título, Descrição, Marca, Cidade, Parceiro, Valor, Compra Mín, Máx Diário, Status */}
  </div>

  <div className="px-6 py-4 border-t shrink-0 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
    <Button variant="outline" onClick={closeDialog} className="w-full sm:w-auto">
      Voltar
    </Button>
    <Button
      onClick={() => save.mutate()}
      disabled={!form.title || !form.brand_id || !form.branch_id || !form.store_id || save.isPending}
      className="w-full sm:w-auto"
    >
      {save.isPending ? "Salvando..." : "Salvar"}
    </Button>
  </div>
</DialogContent>
```

Mudanças concretas:
- `max-h-[90vh]` impede que o dialog estoure a tela
- `flex flex-col` + `overflow-y-auto` no corpo → corpo rola, header/footer ficam fixos
- `p-0 gap-0` no `DialogContent` para o header/footer encostarem nas bordas, e padding é aplicado em cada seção
- Botão **Voltar** explícito ao lado do **Salvar** (mobile-first: empilhado no mobile, lado a lado no desktop)
- Header com `border-b` e footer com `border-t` para separação visual clara

### O que NÃO vou mexer

- ❌ Componente base `src/components/ui/dialog.tsx` — manter o padrão shadcn intacto (afeta o app inteiro)
- ❌ Outros dialogs do app — pedido é pontual nesta tela
- ❌ Lógica de salvar / mutations / queries / form
- ❌ Tabela e filtros da listagem

## Resultado esperado

- No iPhone (430×761), o dialog ocupa no máximo 90% da altura
- Header "Nova Oferta" e o X de fechar ficam visíveis no topo
- Os campos rolam dentro do corpo do dialog
- Botões "Voltar" e "Salvar" ficam fixos no rodapé, sempre visíveis
- Fluxo no desktop continua igual (formulário cabe inteiro)

## Risco

Baixo. Mudança isolada em 1 arquivo, sem alterar lógica nem componentes globais.

## Estimativa

~2 min.

