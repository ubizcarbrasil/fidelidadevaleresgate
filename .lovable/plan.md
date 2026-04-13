

## Plano: Melhorar a página de edição de nomes do sidebar

### Problema
A página `/menu-labels` existe mas exibe os itens como uma tabela plana com chaves técnicas (`sidebar.dashboard`, etc.), sem agrupamento visual. O usuário quer uma experiência melhor para editar os nomes de todos os menus do sidebar.

### Solução
Refatorar a `MenuLabelsPage` para exibir os itens organizados por grupo (seção do sidebar), com 3 abas: **Sidebar Empreendedor**, **Sidebar Cidade** e **App do Cliente**. Cada aba mostra os itens agrupados em cards por seção, com o nome padrão e um campo para o nome personalizado.

### UI proposta

```text
┌──────────────────────────────────────────────┐
│ Nomes e Rótulos                              │
│ Personalize os nomes dos menus...            │
│                                              │
│ [Sidebar Empreendedor] [Sidebar Cidade] [App]│
│                                              │
│ ┌─ Guias Inteligentes ─────────────────────┐ │
│ │  Guia do Empreendedor  [______________]  │ │
│ │  Guia do Emissor       [______________]  │ │
│ │  Módulos               [______________]  │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ ┌─ Cidades ────────────────────────────────┐ │
│ │  Minhas Cidades        [______________]  │ │
│ │  Pacotes de Pontos     [______________]  │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│                          [💾 Salvar Rótulos]  │
└──────────────────────────────────────────────┘
```

### Alterações

| Arquivo | Ação |
|---------|------|
| `src/pages/MenuLabelsPage.tsx` | Refatorar — adicionar 3 abas (admin/brand, admin/branch, customer_app), agrupar itens por seção do sidebar usando os mesmos grupos definidos nos sidebars, exibir em cards com label amigável |
| `src/hooks/useMenuLabels.ts` | Adicionar as chaves faltantes do BranchSidebar nos defaults (ex: `sidebar.comprar_pontos`, `sidebar.pacotes_pontos`, etc.) |

### Detalhes técnicos
- Extrair os grupos e itens dos sidebars (BrandSidebar e BranchSidebar) como constantes reutilizáveis para alimentar a página de edição
- A aba "Sidebar Empreendedor" usa os grupos do `BrandSidebar`
- A aba "Sidebar Cidade" usa os grupos do `BranchSidebar`  
- A aba "App do Cliente" mantém os itens atuais do `customer_app`
- Todas as abas salvam no mesmo `menu_labels` com context `"admin"` (brand+branch compartilham o mesmo context pois usam as mesmas keys) ou `"customer_app"`
- Remover a coluna "Chave" da tabela — mostrar apenas o nome padrão e o campo de edição
- Agrupar visualmente por seção usando Cards com título do grupo

