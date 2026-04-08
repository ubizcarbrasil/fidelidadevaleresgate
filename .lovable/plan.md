

## Corrigir links do Cliente e Motorista na Central de Acessos

### Problema
Os links do Painel Motorista e App do Cliente na página `/links` contêm placeholders literais (`ID_DA_BRAND`), resultando em "Marca não encontrada" ao clicar.

### Solução
Tornar a página dinâmica: buscar as brands ativas do banco e gerar links funcionais com os IDs reais. Cada brand terá seus próprios cards de Motorista e Cliente.

### Arquivos

**`src/features/pagina_links/pagina_links.tsx`**
- Buscar brands ativas via Supabase (`select id, name from brands where is_active = true`)
- Buscar branches ativas (`select id, name, brand_id from branches where is_active = true`)
- Gerar cards dinâmicos para:
  - **Painel Motorista**: um card por brand com `brandId` real
  - **App do Cliente**: um card por brand com `brandId` real  
  - **Painel Cidade**: um card por branch com `branchId` real
  - **Painel Parceiro**: buscar stores e gerar cards com `storeId` real
- Cards administrativos (Painel Raiz, Login) permanecem estáticos
- Mostrar o nome da entidade no card (ex: "Motorista — Ubiz Car")
- Loading state enquanto busca os dados

