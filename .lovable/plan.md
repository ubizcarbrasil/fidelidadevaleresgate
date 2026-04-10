

# Corrigir Nome da Organização + Permitir Edição no Painel

## 1. Correção de dados

Atualizar o nome do tenant `1dcbe0c0-4f9a-48ba-80ee-a8c9404e9382` de "123456" para "Ubiz Resgata" via insert tool (UPDATE).

## 2. Permitir edição do nome da organização no BrandForm

No arquivo `src/pages/BrandForm.tsx`, na aba "Geral" (visível apenas para `root_admin`), adicionar um campo de texto editável ao lado do Select de organização. Quando o root_admin altera o nome, ao salvar a marca, o nome do tenant também é atualizado.

### Mudanças em `src/pages/BrandForm.tsx`:

- Adicionar estado `tenantName` que é preenchido ao carregar a marca (fetch do tenant selecionado)
- Ao lado do Select de organização, adicionar um Input para editar o nome do tenant selecionado
- No `handleSave`, incluir um `supabase.from("tenants").update({ name: tenantName }).eq("id", tenantId)` antes ou junto do save da brand

### Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| (dados) | UPDATE tenants SET name = 'Ubiz Resgata' WHERE id = '1dcbe0c0-...' |
| `src/pages/BrandForm.tsx` | Adicionar campo editável para nome da organização |

