

# Corrida Maçaneta — Identificação, Exclusão do Ranking e Pontuação Configurável

## Contexto

"Maçaneta" é o nome que a TaxiMachine atribui ao passageiro quando o motorista abre uma corrida avulsa (sem passageiro real no app). Atualmente o sistema trata "Maçaneta" como um passageiro real — cria um registro de cliente, credita pontos de passageiro, e aparece no ranking. Isso está errado.

Dados atuais: **86 corridas** com passenger_name = "Maçaneta", **2.747 pontos de passageiro** creditados indevidamente, e um cliente chamado "Maçaneta" no banco.

## O que será feito

### 1. Excluir "Maçaneta" do ranking de passageiros
Alterar a RPC `get_points_ranking` para filtrar `passenger_name != 'Maçaneta'` na query de passageiros. O motorista que fez a corrida continua aparecendo normalmente no ranking de motoristas.

### 2. Não criar cliente nem pontuar passageiro em corridas maçaneta
No webhook, quando `passengerName = 'Maçaneta'` (case-insensitive), pular a criação de customer e a pontuação de passageiro. A corrida ainda é salva em `machine_rides` com `points_credited = 0`, e o motorista continua sendo pontuado normalmente.

### 3. Adicionar pontuação configurável para corrida maçaneta
Adicionar coluna `macaneta_points_per_ride` (integer, default 0) na tabela `driver_points_rules`. Quando a corrida é maçaneta e esse valor é > 0, o motorista recebe essa pontuação **em vez** da regra padrão (que depende do valor da corrida ou % do passageiro). Se for 0, a regra padrão continua valendo.

### 4. Campo de configuração na tela de Regras do Motorista
Adicionar um card "Pontuação Maçaneta" na página `/driver-points-rules` com um campo numérico para definir quantos pontos o motorista ganha por corrida maçaneta. Inclui explicação contextual.

## Detalhes técnicos

### Migração SQL
- Adicionar coluna `macaneta_points_per_ride integer DEFAULT 0` em `driver_points_rules`
- Atualizar `get_points_ranking` para excluir `passenger_name = 'Maçaneta'`

### Webhook (`supabase/functions/machine-webhook/index.ts`)
- Detectar maçaneta: `passengerName?.toLowerCase() === 'maçaneta'`
- Se maçaneta: não buscar/criar customer, setar `points = 0` e `pointsCredited = false`
- Na seção de pontuação do motorista: se maçaneta e `advancedRule.macaneta_points_per_ride > 0`, usar esse valor fixo

### UI (`src/pages/DriverPointsRulesPage.tsx`)
- Novo card com input numérico para `macaneta_points_per_ride`
- Incluir no payload de save/upsert
- Tipo local atualizado

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| Migração SQL | Coluna + atualização da RPC |
| `supabase/functions/machine-webhook/index.ts` | Detectar maçaneta, pular passageiro, usar pontuação especial |
| `src/pages/DriverPointsRulesPage.tsx` | Campo de configuração maçaneta |

