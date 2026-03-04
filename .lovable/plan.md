

## Problema Identificado

Quando o `brand_admin` (`teste-ubizresgata@teste.com`) acessa "Aparência da Marca" no menu lateral, é direcionado para `/brands` - uma página de listagem pensada para o ROOT. Ele vê uma tabela com sua marca e um botão "Nova Marca" irrelevante, ao invés de acessar diretamente o editor de temas da sua marca.

Os dados e permissões estão corretos no banco (RLS permite SELECT e UPDATE para brand_admin na sua própria marca). O problema é puramente de UX/roteamento.

## Plano

### 1. Redirecionar brand_admin para edição direta da sua marca

No componente `Brands.tsx`, adicionar lógica no início: se o usuário for `brand_admin` (não root), extrair o `brand_id` do `useBrandGuard()` e fazer redirect automático para `/brands/{brand_id}`.

### 2. Ajustar BrandForm para brand_admin

No `BrandForm.tsx`, quando o usuário for brand_admin:
- Ocultar o campo de seleção de Tenant (somente leitura)
- Ocultar campos de slug e status que não devem ser alterados pelo empreendedor
- Focar a experiência na aba de Tema (cores, logo, etc.) e Seções

### 3. Atualizar link no BrandSidebar

No `BrandSidebar.tsx`, alterar a URL do item "Aparência da Marca" para apontar diretamente a `/brands/{brandId}` quando o `currentBrandId` estiver disponível, evitando o passo intermediário da listagem.

### Arquivos a modificar
- `src/pages/Brands.tsx` - Redirect para brand_admin
- `src/pages/BrandForm.tsx` - Ocultar campos admin-only para brand_admin  
- `src/components/consoles/BrandSidebar.tsx` - Link direto para a marca do empreendedor

