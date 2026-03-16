

## Plano: Reestruturação Hierárquica de Permissões (Grupo → Subgrupo → Função) com Escopo por Cidade

### Contexto Atual

- Tabela `permissions` tem estrutura plana: `key` (ex: "stores.create") + `module` (ex: "stores")
- `brand_permission_config` liga permissões a marcas com dois switches (Empreendedor / Parceiro)
- Não existe suporte a subgrupos nem escopo por cidade (branch)

### Alterações no Banco de Dados

**1. Nova tabela `permission_groups`** (grupos de primeiro nível):
```sql
CREATE TABLE permission_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,           -- ex: "Comercial"
  icon_name text DEFAULT 'Blocks',
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

**2. Nova tabela `permission_subgroups`** (subgrupos dentro de cada grupo):
```sql
CREATE TABLE permission_subgroups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES permission_groups(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,           -- ex: "Parceiros"
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

**3. Adicionar colunas na tabela `permissions`**:
```sql
ALTER TABLE permissions
  ADD COLUMN subgroup_id uuid REFERENCES permission_subgroups(id) ON DELETE SET NULL,
  ADD COLUMN display_name text,    -- nome amigável editável
  ADD COLUMN order_index int DEFAULT 0,
  ADD COLUMN is_active boolean DEFAULT true;
```

**4. Expandir `brand_permission_config` para suportar escopo por cidade**:
```sql
ALTER TABLE brand_permission_config
  ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  ADD COLUMN scope text DEFAULT 'brand';  -- 'brand' = toda marca, 'branch' = por cidade
-- Permitir config duplicada por branch
ALTER TABLE brand_permission_config DROP CONSTRAINT IF EXISTS brand_permission_config_brand_id_permission_key_key;
ALTER TABLE brand_permission_config ADD UNIQUE (brand_id, permission_key, branch_id);
```

**5. RLS** nas novas tabelas (leitura autenticada, escrita root_admin).

### Alterações na Interface (Painel Root)

**Nova página `BrandPermissionOverflowPage.tsx`** completamente reescrita com:

1. **Seletor de Marca** (já existe) + **Seletor de Cidade** (novo) com opção "Todas as Cidades"
2. **Layout em acordeão hierárquico**:
   - Nível 1: **Grupo** (accordion) — switch para ativar/desativar grupo inteiro
   - Nível 2: **Subgrupo** (collapsible) — switch para ativar/desativar subgrupo inteiro
   - Nível 3: **Função** (item) — switch individual por permissão
3. **Seleção em cascata**: ativar um grupo ativa todos os subgrupos e funções; desativar um subgrupo desativa apenas suas funções
4. **Indicadores visuais**: badge com contagem de permissões ativas por grupo/subgrupo
5. **Botão "Gerenciar Grupos"** (dialog) para criar/renomear/reordenar grupos e subgrupos
6. **Botão "Renomear"** em cada função para editar o `display_name`

**Filtro por Cidade:**
- Dropdown com as cidades da marca selecionada
- Opção "Padrão (todas)" aplica config global
- Ao selecionar uma cidade específica, mostra config herdada do padrão com possibilidade de override
- Badge "Customizado" em cidades com config diferente do padrão

### Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| Migration SQL | Criar tabelas `permission_groups`, `permission_subgroups`, alterar `permissions` e `brand_permission_config` |
| `src/pages/BrandPermissionOverflowPage.tsx` | Reescrever com UI hierárquica + filtro por cidade |
| `src/hooks/usePermissions.ts` | Adaptar para considerar `branch_id` no check de permissão |
| `src/lib/queryKeys.ts` | Adicionar keys para novos queries |

### Fluxo de Uso

```text
Root seleciona Marca "Vale Resgate"
  → Seleciona Cidade: "Todas" (padrão)
    → Abre Grupo "Comercial"
      → Abre Subgrupo "Parceiros"
        → [ON] Criar Parceiros
        → [OFF] Excluir Parceiros
        → [ON] Aprovar Parceiros
      → Abre Subgrupo "Ofertas"
        → [ON] Criar Ofertas
        → [ON] Editar Ofertas
  → Seleciona Cidade: "Curitiba"
    → Herda config padrão, mas pode desativar "Criar Parceiros" só para Curitiba
```

