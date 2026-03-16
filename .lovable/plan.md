

## Plano: Melhorias na Página de Permissões Hierárquicas do Painel Raiz

### Problema Atual

A estrutura de banco (grupos, subgrupos, branch scope) **já existe**, porém há lacunas importantes na UI:

1. **Não há UI para atribuir permissões a subgrupos** — as permissões têm campo `subgroup_id` mas não há como definir isso pela interface; todas aparecem como "não agrupadas"
2. **Não há sub-permissões (subclasse)** — cada permissão é apenas ON/OFF; não é possível restringir *partes* de uma função
3. **Falta drag-and-drop ou seletor** para mover permissões entre subgrupos
4. **Grupos e subgrupos podem ser criados**, mas o dialog de gerenciamento não permite renomear (apenas criar/excluir)

### Alterações Planejadas

#### 1. Banco de Dados — Nova tabela `permission_sub_items`

Tabela para sub-permissões (restrições parciais dentro de uma função):

```sql
CREATE TABLE permission_sub_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE NOT NULL,
  key text NOT NULL,           -- ex: "stores.create.bulk_import"
  display_name text NOT NULL,  -- ex: "Importação em Massa"
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Config por marca/branch
CREATE TABLE brand_sub_permission_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  sub_item_id uuid REFERENCES permission_sub_items(id) ON DELETE CASCADE NOT NULL,
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  is_allowed boolean DEFAULT true,
  UNIQUE (brand_id, sub_item_id, COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'))
);
```

#### 2. UI — Atribuir Permissões a Subgrupos

Na página `BrandPermissionOverflowPage.tsx`, adicionar em cada permissão "não agrupada" um **seletor de subgrupo** (dropdown) que permite mover a permissão para dentro de um grupo/subgrupo existente, atualizando o campo `subgroup_id`.

#### 3. UI — Sub-permissões (Subclasse)

Dentro de cada item de permissão, se houver `permission_sub_items` associados, exibir switches individuais para cada sub-item abaixo da permissão principal. Isso permite ativar a função principal mas restringir partes específicas.

#### 4. UI — Renomear Grupos e Subgrupos

No `ManageGroupsDialog`, adicionar botão de edição inline para renomear grupos e subgrupos (atualmente só cria/exclui).

#### 5. UI — Apenas Cidades Ativas no Seletor

Filtrar o seletor de cidade para mostrar apenas branches com `is_active = true` (já está sendo feito na query, confirmar).

### Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| Migration SQL | Criar `permission_sub_items` e `brand_sub_permission_config` com RLS |
| `src/pages/BrandPermissionOverflowPage.tsx` | Adicionar: seletor de subgrupo para permissões não agrupadas, renderização de sub-permissões, melhorias visuais |
| `src/components/permissions/ManageGroupsDialog.tsx` | Adicionar renomeação inline de grupos e subgrupos |
| `src/lib/queryKeys.ts` | Adicionar keys para sub-items |

### Fluxo de Uso Final

```text
Root → Seleciona Marca → Seleciona Cidade (ou "Todas")
  → Grupo "Comercial" (accordion + switch master)
    → Subgrupo "Parceiros" (collapsible + switch)
      → [ON] Criar Parceiros
        → [OFF] Importação em Massa (sub-permissão)
        → [ON] Cadastro Manual (sub-permissão)
      → [ON] Editar Parceiros
    → Subgrupo "Ofertas"
      → [ON] Criar Ofertas
  → Permissões não agrupadas
    → "Gerenciar Banners" [dropdown: Mover para → Comercial > Marketing]
```

