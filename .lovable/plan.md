
## Plano: Adicionar etapa "Modelo de Negócio" ao Guia de Cidades

### Contexto
O Guia de Cidades (`BrandCidadesJourneyPage.tsx`) tem 6 etapas. Falta uma etapa explicando como configurar o `scoring_model` (DRIVER_ONLY, PASSENGER_ONLY, BOTH) da nova cidade. Essa configuração é feita em **Regras de Resgate** (`/regras-resgate`).

### Alteração

**Arquivo: `src/pages/BrandCidadesJourneyPage.tsx`**

1. Adicionar import do ícone `Settings2` (já disponível no lucide-react)

2. Inserir nova etapa **após a etapa 2 (Criar)** e **antes da etapa 3 (Parceiros)**, com os seguintes dados:

| Campo | Valor |
|---|---|
| id | "3" (renumerar etapas seguintes para 4–7) |
| phase | "Modelo" |
| phaseIcon | `Settings2` |
| phaseColor | `bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300` |
| title | "Definir o modelo de negócio da Cidade" |
| description | "Escolha se a cidade opera com motoristas, passageiros ou ambos." |
| route | `/regras-resgate` |

**Passos:**
- "Acesse Cidades → Regras de Resgate."
- "Selecione a cidade recém-criada no filtro."
- "Escolha o modelo de negócio: Apenas Motorista, Apenas Passageiro ou Ambos."
- "O modelo define quais funcionalidades e menus ficam disponíveis na cidade."
- "Clique em 'Salvar' para aplicar."

**Dicas:**
- "Novas cidades herdam o modelo padrão da marca automaticamente."
- "Você pode alterar o modelo a qualquer momento em Regras de Resgate."
- "O modelo 'Ambos' habilita funcionalidades de motorista e passageiro simultaneamente."

3. Renumerar as etapas seguintes (Parceiros→4, Pontos→5, Clonar→6, Testar→7)

4. Atualizar o texto do banner introdutório de "6 etapas" para "7 Etapas"

### Nenhum outro arquivo é alterado
