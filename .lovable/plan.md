## Diagnóstico

O painel "Maio 2026" está mostrando **2.407 motoristas** ignorando a cidade selecionada (Leme) porque a RPC `brand_get_campeonato_kpis` recebe **apenas `p_brand_id`** — não há filtro por `branch_id` em nenhuma camada.

### Evidências

1. **RPC `brand_get_campeonato_kpis(p_brand_id uuid)`** (no banco):
   - Busca a temporada com `WHERE s.brand_id = p_brand_id ... ORDER BY s.created_at DESC LIMIT 1` — pega a primeira temporada da marca, sem considerar a cidade.
   - Conta `campeonato_tier_memberships` filtrando só por `season_id` — todos os motoristas daquela temporada entram, independentemente da cidade.
   - `machine_rides` também é agregada por `brand_id`, sem `branch_id`.

2. **`campeonato_seasons` tem `branch_id`** (confirmado via schema) — ou seja, cada cidade tem suas próprias temporadas, mas a RPC não usa essa coluna.

3. **Frontend** (`DashboardOperacaoCampeonato.tsx` → `useBrandCampeonatoKPIs(brandId)`) recebe **só `brandId`** — o `branchId` selecionado no admin nunca chega à RPC.

Resultado: o painel mostra a temporada mais recente da marca + todos os motoristas dela (provavelmente uma temporada de outra cidade, ou uma seedada brand-wide).

## Correção proposta

### 1. Migration — alterar a RPC
`brand_get_campeonato_kpis(p_brand_id uuid, p_branch_id uuid DEFAULT NULL)`:
- Filtrar `campeonato_seasons` por `brand_id AND (p_branch_id IS NULL OR branch_id = p_branch_id)`.
- Em `campeonato_tier_memberships`, juntar com `customers` (ou coluna direta de `branch_id` na membership, se existir — verificar) para isolar por cidade.
- Em `machine_rides`, adicionar `AND (p_branch_id IS NULL OR branch_id = p_branch_id)`.
- Em `campeonato_attempts_log`, mesma adição.
- Manter compatibilidade: quando `p_branch_id IS NULL`, comportamento atual (visão da marca inteira).

### 2. Frontend — propagar `branchId`
- `hook_kpis_campeonato.ts`: aceitar `branchId?: string | null`, incluir na queryKey e enviar como `p_branch_id`.
- `servico_campeonato_empreendedor.ts` (`obterKpisCampeonato`): aceitar e enviar `p_branch_id`.
- `DashboardOperacaoCampeonato.tsx`: receber `branchId` por prop.
- `pagina_campeonato_empreendedor.tsx`: ler `?branchId=` da URL (já é o padrão do admin — ver memória "City View Dashboard") e passar para o dashboard.

### 3. Validação manual
Após aplicar:
- Acessar `?branchId=<leme-id>` → KPIs devem mostrar só a temporada e motoristas de Leme.
- Sem `?branchId=` → comportamento atual (marca inteira) preservado.

## Pontos a confirmar antes de codar

- `campeonato_tier_memberships` tem coluna `branch_id` própria, ou precisa join com `customers.branch_id`? Vou verificar no banco antes da migration.
- A intenção é que a visão "marca inteira" (sem branchId) continue existindo, ou todo dashboard de Campeonato passa a ser obrigatoriamente por cidade?
