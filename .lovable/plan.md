

## Plano: Unificar "Aprovar Parceiros" com "Parceiros"

### Ideia
Eliminar a página separada `StoreApprovalsPage` e integrar a funcionalidade de aprovação diretamente na `StoresPage`, usando tabs ou filtros de status.

### Como ficará

A página **Parceiros** (`StoresPage`) ganha:
1. **Tabs de status** no topo: `Todos` | `Pendentes` | `Aprovados` | `Rejeitados`
   - Tab "Pendentes" mostra badge com contagem (já disponível via `useSidebarBadges`)
2. **Coluna `approval_status`** na tabela, com badges coloridos (amarelo/verde/vermelho)
3. **Ações de aprovação inline**: ao clicar numa loja pendente, abre o mesmo Dialog de detalhes com botões Aprovar/Rejeitar
4. Query atualizada para incluir `approval_status` e filtrar por tab selecionada

### Alterações

#### 1. `src/pages/StoresPage.tsx`
- Adicionar state para tab de status (`ALL`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`)
- Atualizar query para filtrar por `approval_status` quando tab não é "ALL"
- Adicionar coluna de status na tabela com badges coloridos
- Adicionar Dialog de detalhes/aprovação (reutilizar lógica do `StoreApprovalsPage`)
- Incluir botões Aprovar/Rejeitar no dialog para lojas pendentes

#### 2. `src/components/consoles/BrandSidebar.tsx`
- Remover item `sidebar.aprovacao_lojas` do grupo "Aprovações"

#### 3. `src/components/consoles/RootSidebar.tsx`
- Remover item `sidebar.aprovacao_lojas` do grupo "Aprovações"

#### 4. `src/components/consoles/BranchSidebar.tsx`
- Remover item `sidebar.aprovacao_lojas`

#### 5. `src/App.tsx`
- Remover rota `/store-approvals` e import do `StoreApprovalsPage`

#### 6. `src/pages/StoreApprovalsPage.tsx`
- Pode ser deletado (código migrado para `StoresPage`)

#### 7. Guias (`BrandJourneyGuidePage.tsx`, `RootJourneyGuidePage.tsx`)
- Atualizar referências de `/store-approvals` para `/stores`

#### 8. `src/hooks/useSidebarBadges.ts`
- Atualizar badge key de `sidebar.aprovacao_lojas` para `sidebar.parceiros`

### Resultado
Um único menu **"Parceiros"** com visão completa: listagem + aprovação + gestão, sem precisar navegar entre duas páginas.

