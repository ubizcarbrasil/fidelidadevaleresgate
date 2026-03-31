

# Fluxo Simplificado de Cidades para Empreendedor + Jornada Didática

## Contexto
Atualmente, o empreendedor (brand_admin) usa o mesmo formulário de cidades que o root_admin, com campos técnicos como slug, timezone, latitude/longitude. O objetivo é criar uma versão simplificada e uma jornada didática dedicada.

## Plano

### 1. Criar formulário simplificado de cidade para brand_admin
**Arquivo:** `src/pages/BrandBranchForm.tsx`

Formulário com apenas os campos essenciais:
- **UF** (select) — obrigatório
- **Cidade** (input) — obrigatório
- **Ativo** (switch)

Os campos técnicos serão preenchidos automaticamente:
- `name` → "Cidade - UF" (auto)
- `slug` → normalizado (auto)
- `timezone` → "America/Sao_Paulo" (default)
- `latitude/longitude` → geocodificação automática via Nominatim (já existe a função)
- `brand_id` → do contexto do usuário (auto)

O seletor de marca fica oculto (brand_admin só tem uma marca). Campos como timezone, lat/lon e slug ficam apenas no formulário root.

### 2. Criar listagem simplificada de cidades para brand_admin
**Arquivo:** `src/pages/BrandBranchesPage.tsx`

Listagem limpa mostrando apenas:
- Nome da cidade
- UF
- Status (ativo/inativo)
- Botão editar e ativar/desativar

Sem coluna "Marca" (redundante para brand_admin). Com card de resumo no topo mostrando total de cidades ativas.

### 3. Criar jornada didática "Expandindo para Novas Cidades"
**Arquivo:** `src/pages/BrandCidadesJourneyPage.tsx`

Guia passo a passo no mesmo padrão visual do `BrandJourneyGuidePage`, com fases:
1. **Entender o conceito** — O que é uma "Cidade" na plataforma e por que criar novas
2. **Criar sua primeira nova cidade** — Passo a passo do formulário simplificado
3. **Ativar parceiros na nova cidade** — Como vincular parceiros
4. **Configurar regras de pontos** — Regras independentes por cidade
5. **Duplicar configurações** — Usar Clone de Região para copiar tudo
6. **Verificar no app do cliente** — Testar a troca de cidade no app

### 4. Registrar rotas no App.tsx
- `/brand-branches` → `BrandBranchesPage`
- `/brand-branches/new` → `BrandBranchForm`
- `/brand-branches/:id` → `BrandBranchForm`
- `/brand-cidades-journey` → `BrandCidadesJourneyPage`

### 5. Adicionar ao menu lateral do empreendedor
**Arquivo:** `src/components/consoles/BrandSidebar.tsx`

- No grupo "Organização" ou equivalente, substituir o link `/branches` por `/brand-branches` para brand_admin
- No grupo "Guias Inteligentes", adicionar "Guia de Cidades" apontando para `/brand-cidades-journey`

### 6. Atualizar a jornada principal do empreendedor
**Arquivo:** `src/pages/BrandJourneyGuidePage.tsx`

Na Fase 3 (Gerenciar Cidades), atualizar a rota de `/branches` para `/brand-branches` e simplificar os passos para refletir o novo formulário.

## Arquivos criados
- `src/pages/BrandBranchForm.tsx`
- `src/pages/BrandBranchesPage.tsx`
- `src/pages/BrandCidadesJourneyPage.tsx`

## Arquivos editados
- `src/App.tsx` — novas rotas
- `src/components/consoles/BrandSidebar.tsx` — menu atualizado
- `src/pages/BrandJourneyGuidePage.tsx` — rota da Fase 3

