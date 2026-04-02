

# Afinamento do Modelo de Negócio: Pontuação por Cidade

## Contexto Atual

O sistema já possui:
- Hierarquia Empreendedor (Brand) → Franqueado (Branch) com isolamento de dados via `useBrandGuard`
- Chave API, webhook URL e Telegram Chat ID por cidade na tabela `machine_integrations`
- Flag `driver_points_enabled` na integração para habilitar/desabilitar pontuação de motorista
- Módulo `achadinhos_motorista` controlando visibilidade do menu no painel do franqueado
- O webhook já pontua passageiro (sempre) e motorista (se `driver_points_enabled = true`)

## O que falta

O sistema não tem um conceito explícito de **modelo de negócio por cidade** que defina se a cidade pontua: (1) apenas motorista, (2) apenas cliente/passageiro, ou (3) ambos. Atualmente, o passageiro sempre é pontuado e o motorista é opcional.

## Plano de Implementação

### 1. Migration: adicionar coluna `scoring_model` na tabela `branches`

Adicionar um campo enum-like na tabela `branches` com três opções:
- `DRIVER_ONLY` — pontua apenas motorista
- `PASSENGER_ONLY` — pontua apenas passageiro/cliente
- `BOTH` — pontua ambos

```sql
ALTER TABLE public.branches 
  ADD COLUMN scoring_model text NOT NULL DEFAULT 'BOTH';
```

Default `BOTH` para manter retrocompatibilidade com cidades existentes.

### 2. Atualizar formulário de cidade (`BrandBranchForm.tsx`)

Adicionar um seletor visual (radio group ou select) na seção de configuração da cidade para escolher o modelo de negócio:
- "Pontuar apenas Motorista"
- "Pontuar apenas Cliente"  
- "Pontuar Ambos"

Salvar o valor em `branches.scoring_model`.

### 3. Atualizar webhook (`machine-webhook/index.ts`)

Modificar a lógica de pontuação para respeitar o `scoring_model` da cidade:
- Buscar `scoring_model` da tabela `branches` junto com a integração
- Se `DRIVER_ONLY`: pular pontuação do passageiro, manter pontuação do motorista
- Se `PASSENGER_ONLY`: manter pontuação do passageiro, pular pontuação do motorista
- Se `BOTH`: manter comportamento atual (pontuar ambos)

### 4. Adaptar menus do painel do franqueado (`BranchSidebar.tsx`)

Filtrar itens de menu baseado no `scoring_model` da cidade:
- Se `DRIVER_ONLY`: mostrar grupo "Achadinhos Motorista", ocultar "Programa de Fidelidade" e itens de cliente
- Se `PASSENGER_ONLY`: mostrar "Programa de Fidelidade" e "Gestão Comercial", ocultar grupo motorista
- Se `BOTH`: mostrar tudo

Criar um hook `useBranchScoringModel` que consulta o `scoring_model` da branch atual.

### 5. Dashboard do franqueado adaptativo

Ajustar os KPIs do dashboard da cidade para exibir apenas métricas relevantes ao modelo ativo:
- `DRIVER_ONLY`: Corridas, Motoristas, Pontos Distribuídos, Carteira
- `PASSENGER_ONLY`: Clientes, Resgates, Parceiros, Pontos Fidelidade
- `BOTH`: Todos os KPIs

### 6. Validação de consistência

Na tela de Cidades do empreendedor (Brand), exibir badge visual indicando o modelo de cada cidade na listagem (ex: "🚗 Motorista", "👤 Cliente", "🔄 Misto").

## Arquivos a modificar

| Arquivo | Alteração |
|---|---|
| **Nova migration SQL** | Adicionar `scoring_model` em `branches` |
| `src/pages/BrandBranchForm.tsx` | Seletor de modelo de negócio |
| `supabase/functions/machine-webhook/index.ts` | Condicionar pontuação ao modelo |
| `src/components/consoles/BranchSidebar.tsx` | Filtrar menus pelo modelo |
| `src/hooks/useBranchScoringModel.ts` (novo) | Hook para consultar modelo da cidade |
| `src/pages/BrandBranchList.tsx` | Badge visual do modelo na listagem |
| Dashboard da cidade | KPIs adaptativos |

## Segurança

- O `scoring_model` é controlado pelo empreendedor (Brand Admin) ou Root
- O franqueado (Branch Admin) não pode alterar o modelo da sua cidade
- O webhook valida server-side, independente do frontend

