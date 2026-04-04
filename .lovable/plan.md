
## Plano: Onboarding de Cidade com Validação Automática

### Conceito
Página similar ao Guia de Cidades existente, mas com **validação em tempo real** — cada etapa consulta o banco para verificar se foi concluída. Inclui um **painel de teste final** que valida toda a configuração antes de considerar a cidade pronta.

### Estrutura de Arquivos

```
src/features/city_onboarding/
├── pagina_onboarding_cidade.tsx          (página principal)
├── hooks/
│   └── hook_validacao_cidade.ts          (hook que consulta o banco para cada etapa)
├── components/
│   ├── etapa_onboarding.tsx              (card de etapa com status de validação)
│   ├── seletor_cidade.tsx                (dropdown para selecionar a cidade a validar)
│   ├── painel_teste_final.tsx            (card final com resumo de validações)
│   └── indicador_progresso.tsx           (barra de progresso geral)
├── constants/
│   └── constantes_etapas.ts             (definição das etapas e mensagens)
└── types/
    └── tipos_onboarding.ts              (interfaces)
```

### Etapas com Validação

| # | Etapa | Validação Automática |
|---|-------|---------------------|
| 1 | Criar Cidade | Verifica se `branches` tem a cidade selecionada |
| 2 | Modelo de Negócio | Verifica `scoring_model` no branch |
| 3 | Parceiros | Conta `stores` ativas no branch (≥ 1) |
| 4 | Regras de Pontos | Verifica regras em `points_rules` ou `driver_points_rules` conforme modelo |
| 5 | Integração Mobilidade | Se modelo DRIVER/BOTH: verifica `machine_integrations` configurada |
| 6 | Carteira de Pontos | Se modelo DRIVER/BOTH: verifica `branch_points_wallet` com saldo > 0 |
| 7 | Ofertas Ativas | Conta `offers` ativas no branch (≥ 1) — apenas se PASSENGER/BOTH |
| 8 | Teste Final | Executa todas as validações e mostra resultado consolidado |

### Indicadores Visuais
- ✅ Verde: Etapa concluída (validação passou)
- ⏳ Amarelo: Etapa pendente
- ❌ Vermelho: Etapa com problema (ex: carteira sem saldo)
- Barra de progresso no topo (X de Y etapas concluídas)

### Fluxo do Usuário
1. Seleciona a cidade no dropdown
2. O hook consulta todas as validações em paralelo
3. Cada etapa mostra status + botão "Ir configurar"
4. O painel final mostra checklist consolidado + status "Cidade Pronta" ou "Pendências"

### Alterações em Arquivos Existentes
1. **`src/App.tsx`**: Nova rota `/city-onboarding`
2. **`src/components/consoles/BrandSidebar.tsx`**: Novo item "Onboarding Cidade" no grupo Cidades

### Hook de Validação (`hook_validacao_cidade.ts`)
Usa `useQuery` com a cidade selecionada para consultar:
- `branches` (dados do branch)
- `stores` (count where branch_id and is_active)
- `offers` (count where branch_id and is_active and status = ACTIVE)
- `branch_points_wallet` (balance)
- `machine_integrations` (where branch_id)
- `points_rules` / `driver_points_rules` (where branch_id)

Retorna um objeto com status de cada etapa.
