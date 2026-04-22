

# Registrar "Campeonato Motorista" como Modelo de Negócio + Módulo

## Diagnóstico

O Campeonato Duelo Motorista (Brasileirão dos motoristas — temporadas mensais, séries A/B/C, mata-mata, premiações) está 100% implementado em código (tabelas `duelo_seasons`, `duelo_brackets`, `duelo_champions`, `duelo_season_tiers`, fluxo completo em `src/features/campeonato_duelo/`), mas **nunca foi cadastrado nos catálogos da plataforma**:

| Catálogo | Esperado | Hoje |
|---|---|---|
| `business_models` | linha `campeonato_motorista` | **não existe** |
| `business_model_modules` | módulos pré-requisito vinculados | **não existe** |
| `plan_business_models` | incluído em Free/Starter/Pro/Enterprise | **não existe** |
| `module_definitions` | módulo `campeonato_motorista` (engajamento, audiência motorista) | **não existe** |

Por isso, na imagem 1 (lista de modelos do empreendedor) só aparecem Duelo, Cinturão, Aposta e Ranking — **não há "Campeonato"**. O empreendedor não consegue ativar o produto, e ninguém consegue criar ofertas/produtos vinculados a ele.

A ativação hoje só acontece via uma flag escondida (`brand_settings_json.duelo_campeonato_enabled`) acessível pelo card dentro da página do Campeonato — fora do fluxo padrão de Modelos × Planos.

## Solução

### Migration (única) — popula os catálogos

1. **`business_models`**: inserir 1 linha
   - `key = 'campeonato_motorista'`
   - `name = 'Campeonato Motorista'`
   - `description = 'Temporadas mensais com séries hierárquicas (A, B, C…), mata-mata e premiações para motoristas — o "Brasileirão" da cidade'`
   - `audience = 'motorista'`
   - `icon = 'Trophy'`, `color = '#F59E0B'`, `sort_order = 95` (entre Cinturão e Resgate por Pontos Motorista)
   - `pricing_model = 'included'`, `is_sellable_addon = true`

2. **`module_definitions`**: inserir 1 linha
   - `key = 'campeonato_motorista'`, `name = 'Campeonato Motorista'`
   - `category = 'engajamento'`, `customer_facing = true`, `is_active = true`, `is_core = false`

3. **`business_model_modules`**: vincular o novo modelo a seus pré-requisitos (mesmo padrão dos demais motorista-models):
   - `points`, `notifications`, `driver_hub`, `machine_integration`, `achadinhos_motorista`
   - + o novo módulo `campeonato_motorista` (autoligado)

4. **`plan_business_models`**: incluir o modelo nos 4 planos padrão (`free`, `starter`, `profissional`, `enterprise`) seguindo o mesmo padrão dos outros modelos motorista.

5. **`plan_module_templates`**: incluir o módulo `campeonato_motorista` em todos os planos com `is_enabled = true` (igual aos demais módulos motorista hoje).

6. **Backfill da flag por marca**: para toda `brand` cujo `subscription_plan` esteja em `('starter','profissional','enterprise')`, popular `brand_settings_json.duelo_campeonato_enabled = true` somente se ainda não estiver definido — para que marcas existentes não percam o estado atual nem sejam ativadas sem querer.

### Reaproveitamento da flag existente (sem quebrar nada)

O hook `useDueloCampeonatoHabilitado` continua sendo a fonte da verdade em runtime — ele já lê `brand_settings_json.duelo_campeonato_enabled`. Vamos:

- **Sincronizar bidirecionalmente** o toggle do módulo `campeonato_motorista` em `brand_modules` com a flag `duelo_campeonato_enabled`:
  - quando o root admin (Central de Módulos → Empreendedores) ativa o módulo `campeonato_motorista` para uma marca → também grava `brand_settings_json.duelo_campeonato_enabled = true`
  - quando desativa → grava `false`
  - feito num trigger SQL `AFTER INSERT/UPDATE ON brand_modules` que cuida só desse module key específico

Isso garante que o card "Ativar Campeonato" dentro da página do empreendedor e o toggle na Central de Módulos contam a mesma história, sem precisar alterar nenhum componente React.

### Catálogo de produtos (criar produtos vinculados ao Campeonato)

Hoje o seletor de audiência em ofertas/produtos usa a tabela `business_models` (audiência `motorista`) para listar opções. Como o novo modelo já estará em `business_models`, ele passa a aparecer **automaticamente** no criador de produtos como uma opção de audiência válida — sem mexer em código.

Verificação adicional: confirmar que a página de criação de produtos lê os modelos via `business_models WHERE audience='motorista' AND is_active=true`. Se ainda houver lista hardcoded em algum lugar de Achadinhos/Resgates, ajustar para também considerar o novo modelo.

### Resultado esperado

Depois da migration, no console do Root Admin:

- **Aba Catálogo**: aparece o módulo "Campeonato Motorista" (categoria Engajamento)
- **Aba Modelos**: aparece o card "Campeonato Motorista" no grupo Motorista
- **Aba Modelos × Planos**: aparece como linha selecionável em Free/Starter/Pro/Enterprise
- **Aba Empreendedores**: ao abrir uma marca, aparece o toggle "Campeonato Motorista" na seção Engajamento, ligado por padrão se o plano da marca o inclui
- **Aba Cidades** (override por cidade): aparece como módulo disponível para forçar ON/OFF por cidade
- **Página do Campeonato (empreendedor)**: o card "Ativar Campeonato" continua funcionando — ele agora reflete o mesmo estado do toggle global

E no fluxo de produtos:

- **Criador de produto/oferta**: surge "Campeonato Motorista" como audiência selecionável, permitindo criar premiações, vouchers e ofertas vinculadas ao campeonato

## Arquivos impactados

**Migration (1 nova):**
- `supabase/migrations/<timestamp>_registrar_campeonato_motorista.sql` — todos os inserts + trigger de sincronização da flag legada

**Edição (0 ou 1):**
- Se a verificação confirmar lista hardcoded de modelos motorista em algum criador de produto, ajustar 1 arquivo para usar a tabela `business_models` como fonte. Caso contrário, **zero arquivos editados** — só migration.

## Risco e rollback

- **Risco baixo**: migration apenas adiciona linhas em catálogos e cria 1 trigger pontual.
- Marcas existentes não mudam de estado: o backfill respeita `duelo_campeonato_enabled` já definido.
- Flags em código (`USE_DUELO_CAMPEONATO`) ficam inalteradas — continuam servindo de "kill switch" global.
- **Rollback**: down migration remove o trigger, as 2 linhas de `business_models`/`module_definitions` e suas FKs em cascade limpam o resto.

