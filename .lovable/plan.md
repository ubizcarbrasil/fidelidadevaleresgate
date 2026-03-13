

## Analise do Fluxo: Cadastro de Loja com Segmento Novo ate a Home

### Fluxo Atual (Passo a Passo)

1. **Cadastro** (`StoreRegistrationWizard`): Parceiro preenche dados e seleciona segmento via `SegmentAutocomplete` (que usa a edge function `match-taxonomy`). O `taxonomy_segment_id` e salvo na loja. Status inicial = `DRAFT`, depois `PENDING_APPROVAL` ao submeter.

2. **Aprovacao** (`StoreApprovalsPage`): Admin aprova a loja. Nesse momento, o codigo faz:
   ```
   approval_status: "APPROVED", is_active: true
   ```
   Isso garante que a loja fica ativa apos aprovacao.

3. **Exibicao na Home** (`SegmentNavSection`): Busca todas as lojas com `is_active = true` e agrupa por `taxonomy_categories` (via `taxonomy_segments`). Se a loja aprovada tem um `taxonomy_segment_id` cujo segmento pertence a uma categoria, essa categoria aparece automaticamente.

### Resultado: Funciona Automaticamente

O fluxo e **automatico e funcional**. Quando uma loja com um segmento novo e aprovada, a categoria correspondente aparece na Home sem necessidade de intervencao manual.

### Problema Identificado

A query do `SegmentNavSection` filtra apenas por `is_active = true`, mas **nao filtra por `approval_status = 'APPROVED'`**. Isso significa que lojas em `DRAFT` ou `PENDING_APPROVAL` (que tem `is_active = true` por default da coluna) podem fazer categorias aparecerem indevidamente na Home.

### Correcao Necessaria

Adicionar `.eq("approval_status", "APPROVED")` nas queries de:

1. **`SegmentNavSection.tsx`** - query de categorias na Home
2. **`CategoryGridOverlay.tsx`** - grid completo de categorias (mesma query sem o filtro)

### Resumo

| Etapa | Status |
|-------|--------|
| Cadastro salva `taxonomy_segment_id` | OK |
| Aprovacao ativa a loja (`is_active: true`) | OK |
| Home exibe categoria automaticamente | OK, mas precisa filtro de `approval_status` |
| **Correcao**: Adicionar filtro `approval_status = APPROVED` | Necessario |

