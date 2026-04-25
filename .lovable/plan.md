## Problema

Ao abrir **Gamificação Admin → Campeonato → selecionar cidade**, a tela quebra com:

> `undefined is not an object (evaluating 's.top.length')`

## Causa raiz

A RPC `brand_get_campeonato_dashboard` (em `supabase/migrations/20260422010737_*.sql`) devolve um JSON cujos nomes de campos **não batem** com o que o frontend espera no tipo `DashboardCampeonatoData` (`src/features/campeonato_duelo/types/tipos_empreendedor.ts`). O serviço apenas faz `as DashboardCampeonatoData` sem mapear, então os campos chegam `undefined` e estouram no primeiro `.length` / `.map`.

| Frontend espera | RPC devolve |
|---|---|
| `tiers[].top` | `tiers[].top3` ← **causa direta do erro** |
| `tiers[].members_count` | `tiers[].total_drivers` |
| `tiers[].top[].position` | (não retornado) |
| `active_season.id` | `active_season.season_id` |
| `active_season.name` | `active_season.season_name` |
| `active_season.branch_name` | (não retornado) |
| `has_active_season`, `engagement_format` | (não retornados — devolve só `active_season` e `tiers`) |

Resultado: `serie.top` é `undefined` → `serie.top.length` quebra o `ErrorBoundary`.

## Solução

Adaptar **no frontend, na camada de serviço** (sem migração de banco — mais rápido e seguro). Mapeamos o JSON cru da RPC para o shape esperado pelos tipos/components.

### Arquivo a editar

`src/features/campeonato_duelo/services/servico_campeonato_empreendedor.ts` — função `obterDashboardCampeonato`:

1. Tipar o retorno cru como `unknown` e ler defensivamente.
2. Construir o objeto `DashboardCampeonatoData` mapeando:
   - `active_season.season_id` → `id`
   - `active_season.season_name` → `name`
   - demais campos copiados 1-a-1, com `branch_name: null` quando ausente
   - `has_active_season` derivado de `active_season != null`
   - `engagement_format` resolvido pela RPC `brand_get_engagement_format` já existente, ou caímos para `"duelo"` por padrão (mantendo retrocompatível)
3. Para cada `tier`, mapear:
   - `top: (raw.top3 ?? []).map(d => ({ ...d, position: null }))`
   - `members_count: raw.total_drivers ?? 0`
   - `qualified_count: raw.qualified_count ?? 0`
4. Garantir defaults seguros: `tiers: []`, `top: []`, nunca `undefined`.

### Hardening adicional (defesa em profundidade)

`src/features/campeonato_duelo/components/empreendedor/CardResumoSerie.tsx`:
- Trocar `serie.top.length === 0` por `(serie.top ?? []).length === 0`
- Trocar `serie.top.slice(0, 3)` por `(serie.top ?? []).slice(0, 3)`

Assim, mesmo que uma futura RPC volte a divergir, a tela não quebra — apenas mostra "Sem motoristas pontuando ainda."

## Resultado esperado

- Página do Campeonato carrega normalmente após selecionar a cidade.
- Cards de série exibem `top 3`, contagem de motoristas e qualificados corretos.
- Ações de temporada ativa (`ativa.id`) voltam a funcionar (botão de seeding, distribuição manual, etc.).

## Escopo

Mudança pequena, em **2 arquivos**, sem migração SQL, sem mudança de tipos. Risco baixo — o mapeamento é puramente aditivo.
