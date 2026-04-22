

# Habilitar/desabilitar formatos de engajamento (Duelo 1v1, Desafio em Massa, Campeonato) por marca

## Diagnóstico

Hoje o seletor de **Formato de engajamento** mostra os 3 cards fixos (`duelo`, `mass_duel`, `campeonato`) e qualquer um pode ser ativado. Não há controle de:

- **Root**: quais formatos cada marca tem disponíveis no plano dela
- **Empreendedor**: visualização de quais formatos estão liberados pra ele

A flag `engagement_format` em `brand_business_models` guarda **qual** formato está ativo, mas não **quais** podem ser escolhidos.

## Solução

Modelo em 2 camadas (Root libera → Empreendedor escolhe entre liberados, mantendo 1 ativo por vez):

### Camada 1 — Config no banco (1 migration)

Adicionar campo `allowed_engagement_formats text[]` em `brand_business_models`:

- Default: `ARRAY['duelo','mass_duel','campeonato']` (todas liberadas)
- Somente Root pode editar (RLS já bloqueia escrita do empreendedor por padrão; reforçar via política se necessário)
- Validar que `engagement_format` ativo está sempre dentro de `allowed_engagement_formats` (constraint via trigger)
- Backfill: marcar todas as linhas existentes com as 3 formas liberadas

Atualizar a função `duelo_change_engagement_format` para também rejeitar troca se o novo formato não estiver na lista permitida da marca, com mensagem clara: _"Formato 'Campeonato' não está liberado para esta marca."_.

### Camada 2 — UI Root Admin (Central de Módulos → Empreendedores)

Quando o root abrir o card do modelo `duelo_motorista` de uma marca, expor um novo bloco **"Formatos disponíveis"** com 3 switches (Duelo 1v1 / Desafio em Massa / Campeonato). 

- Pelo menos 1 deve permanecer ligado (validação client + server)
- Se o root desligar o formato que está atualmente ativo na marca, mostra confirmação: _"Isso vai desativar o formato atual. A marca precisará escolher outro."_ → ao confirmar, troca o `engagement_format` para o primeiro disponível restante
- Hook novo `useFormatosPermitidos(brandId)` busca/atualiza o array via Supabase

### Camada 3 — UI Empreendedor (`SeletorFormatoEngajamento.tsx`)

Reaproveitar o componente atual com 1 mudança visual:

```text
┌─────────────────────────────────┐
│ ⚔ Duelo 1v1          [✓ Ativo] │ ← liberado + selecionado
├─────────────────────────────────┤
│ ⚡ Desafio em Massa             │ ← liberado, clicável pra trocar
├─────────────────────────────────┤
│ 🔒 Campeonato       [Bloqueado] │ ← cinza, cadeado, tooltip
└─────────────────────────────────┘
```

- Hook `useFormatosPermitidos(brandId)` no componente
- Card desabilitado: `opacity-60`, ícone `Lock` no canto, badge "Não disponível no seu plano", `disabled` no botão, `cursor-not-allowed`, tooltip "Fale com o suporte para liberar este formato"
- Confirmação de troca (`AlertDialog`) só dispara para formatos liberados — comportamento atual preservado

### Camada 4 — Aproveitamento na criação de produtos/ofertas

Como o seletor de produtos hoje lista modelos via `business_models` (auto-incluindo `campeonato_motorista` após o registro anterior), o filtro adicional fica simples: ao montar a lista de audiências/modelos no criador de produtos, esconder/bloquear os modelos cujo `engagement_format` correspondente não esteja nos `allowed_engagement_formats` da marca. Isso mantém a regra "1 produto = 1 formato" e respeita a configuração do root.

### Resultado esperado

| Persona | Antes | Depois |
|---|---|---|
| Root Admin | Sem controle por marca | Toggles "Quais formatos esta marca pode usar" no card do modelo Duelo Motorista |
| Empreendedor | Vê 3 cards iguais | Vê 3 cards: liberados clicáveis + bloqueados com cadeado |
| Criador de produtos | Lista todos os modelos motorista | Esconde/bloqueia modelos cujo formato não está liberado pra marca |

## Arquivos impactados

**Migration nova (1):**
- `supabase/migrations/<timestamp>_allowed_engagement_formats.sql` — coluna nova + default + backfill + trigger de validação + atualiza RPC `duelo_change_engagement_format`

**Hooks novos (1):**
- `src/compartilhados/hooks/hook_formatos_permitidos.ts` — read + mutation (escrita só funciona pra root)

**Componentes novos (1):**
- `src/features/painel_modelos_negocio/components/configurador_formatos_duelo.tsx` — bloco com 3 switches usado dentro do CardModeloBrand quando `def.key === 'duelo_motorista'`

**Edição (3):**
- `src/features/painel_modelos_negocio/components/card_modelo_brand.tsx` — montar o configurador quando key for duelo_motorista (visível só pra root)
- `src/features/campeonato_duelo/components/empreendedor/SeletorFormatoEngajamento.tsx` — consumir `useFormatosPermitidos` e renderizar estado bloqueado
- 1 arquivo do criador de produtos (a confirmar entre `passo_modelos.tsx` ou similar) — filtrar modelos por formatos liberados

## Risco e rollback

- **Risco baixo**: nova coluna com default cobre marcas existentes (todas as 3 liberadas → comportamento atual).
- Trigger de validação rejeita estados inválidos antes do commit.
- **Rollback**: down migration remove coluna e trigger, restaura a versão anterior da RPC. UI volta a mostrar os 3 cards sem cadeado naturalmente (hook devolve default).

