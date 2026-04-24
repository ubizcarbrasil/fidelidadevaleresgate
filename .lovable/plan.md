## Problema

A marca **Ubiz Shop** tem o produto comercial **"Cliente Resgate"** (apenas audiência `cliente`). Mas o Dashboard ainda mostra elementos de motorista:

- Aba **"Motoristas"** dentro do Ranking de Pontuação
- Banner **"Duelos & Ranking"** (gamificação de motorista)
- Quick link **"Painel do Motorista"**
- Quick link **"Conversão por Público"** (correto manter) com card **"Taxa do Motorista"** dentro dele

### Causa raiz

O Dashboard decide o que mostrar com base no `scoring_model` das **branches** (cidades) através do hook `useBrandScoringModels`. A cidade da marca está como `BOTH` (legado), então o Dashboard acha que motorista está habilitado — mesmo o produto contratado dizendo o contrário.

A regra arquitetural do projeto já estabelece: **"Audiência do produto contratado tem precedência sobre o scoring_model das branches"**. O `BrandSidebar` já segue essa regra (combina `useProductScope` + `useBrandScoringModels`); o Dashboard e a página de Conversão ainda não.

## Solução

Aplicar no Dashboard e nas páginas relacionadas a mesma combinação que o sidebar usa:

```text
audiencia_efetiva = audiencia_do_produto AND scoring_model_da_cidade
```

Ou seja: só considera motorista habilitado quando o **produto inclui motorista** E a **cidade está configurada para motorista**. Idem para cliente. Isso elimina inconsistências causadas por configurações legadas das cidades.

### Arquivos a modificar

1. **`src/pages/Dashboard.tsx`**
   - Importar `useProductScope` e calcular as flags efetivas:
     ```ts
     const escopo = useProductScope();
     const audienciaMotoristaAtiva = escopo.hasAudience("motorista") && isDriverEnabled;
     const audienciaClienteAtiva = escopo.hasAudience("cliente") && isPassengerEnabled;
     ```
   - Substituir todas as ocorrências de `isDriverEnabled` / `isPassengerEnabled` pelos novos valores efetivos ao passar para `DashboardKpiSection`, `DashboardChartsSection`, `DashboardQuickLinksSection`, `RidesCounterCard` e o banner de Gamificação.

2. **`src/pages/conversao_resgate/pagina_conversao_resgate.tsx`**
   - Importar `useProductScope` + `useBrandScoringModels`.
   - Renderizar o card **"Taxa do Motorista"** apenas se a audiência motorista estiver efetivamente ativa.
   - Renderizar o card **"Taxa do Passageiro"** apenas se a audiência cliente estiver efetivamente ativa.
   - Se só uma audiência está ativa, o grid passa a ter uma única coluna centralizada.
   - Atualizar o subtítulo da página para refletir o público vigente (ex: "Defina a taxa de conversão para passageiros" quando só cliente).

### O que vai acontecer na tela da Ubiz Shop

- **Ranking de Pontuação**: deixa de mostrar a aba "Motoristas". Mostra direto a lista de Passageiros, sem abas.
- **Banner Duelos & Ranking**: some (era exclusivo de motorista).
- **Painel do Motorista** nos quick links: some.
- **Conversão por Público**: passa a mostrar apenas o card "Taxa do Passageiro".
- **Pontuações em Tempo Real / Mapa de Atividade**: passam a contabilizar apenas eventos de cliente.
- **KPIs de motorista (total motoristas, pontos motoristas)**: já são filtrados pelas mesmas flags via `DashboardKpiSection`.

### Impacto colateral

- Marcas com plano **enterprise** ou **free** continuam permissivas (mostram tudo) porque `useProductScope.isPermissive = true` para esses planos.
- Marcas com produto que cobre motorista E cliente continuam vendo tudo.
- Não toca em RLS nem em dados — só na renderização condicional.
