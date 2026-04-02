

# Toggle "Resgate na Cidade" no painel da cidade

## Resumo
Adicionar uma flag `is_city_redemption_enabled` na tabela `branches` e um toggle no formulário de cidade, controlando a visibilidade da seção "Resgate na Cidade" no marketplace do motorista.

## Implementação

### 1. Migration: nova coluna em `branches`
```sql
ALTER TABLE public.branches 
  ADD COLUMN is_city_redemption_enabled boolean NOT NULL DEFAULT false;
```
Default `false` — o empreendedor ativa manualmente por cidade.

### 2. Toggle no formulário de cidade (`BrandBranchForm.tsx`)
Adicionar um card com Switch similar ao campo "Ativa", com label "Resgate na Cidade" e descrição explicando que habilita a troca de pontos por créditos em parceiros locais para motoristas.

Estado carregado do `existing` e salvo no payload de insert/update.

### 3. Badge na listagem de cidades (`BrandBranchesPage.tsx`)
Exibir badge visual "Resgate Cidade" quando a flag estiver ativa, para identificação rápida.

### 4. Filtro no marketplace (`DriverMarketplace.tsx`)
Na condição de exibição da `SecaoResgateCidade`, adicionar verificação: `branch?.is_city_redemption_enabled === true`. A query de `cityOffers` só executa se a flag estiver ativa.

## Arquivos

| Arquivo | Alteração |
|---|---|
| Nova migration SQL | Coluna `is_city_redemption_enabled` |
| `src/pages/BrandBranchForm.tsx` | Toggle Switch |
| `src/pages/BrandBranchesPage.tsx` | Badge visual |
| `src/components/driver/DriverMarketplace.tsx` | Condicionar seção à flag |

