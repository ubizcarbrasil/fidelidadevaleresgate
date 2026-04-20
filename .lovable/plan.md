

# Auditoria de Duplicações de Ação nos 3 Painéis

## O que você está pedindo

Mapear todos os pontos onde **a mesma ação/funcionalidade aparece em mais de um lugar** (ex.: "Configurar Painel do Motorista" pode estar acessível tanto pelo menu Root quanto via Cidades) e marcar visualmente esses itens com uma **tag de sinalização** ("⚠️ DUPLICADO") para você decidir, item por item, se mantém ou remove.

A varredura cobre os 3 consoles: **Root**, **Empreendedor (Brand)** e **Cidade (Branch)**.

## Antes de implementar — preciso confirmar 2 decisões

### Decisão 1 — O que conta como "duplicado"?

**Opção A — Mesma rota repetida em mais de um menu/grupo.** Ex: `/branches` em "Organização" E em "Cidades". Detecção: comparar `url` no `MENU_REGISTRY`.

**Opção B — Mesma funcionalidade em rotas diferentes.** Ex: `/configuracao-cidade` + `/configuracao-modulos-cidade` + `/branches/:id/edit` fazem coisas parecidas. Detecção: agrupar por similaridade de propósito (subjetivo, exige minha análise + sua revisão).

**Opção C — Mesma ação em locais diferentes da UI (não só sidebar).** Ex: botão "Criar produto" no header da página E dentro do Wizard; "Ver Manual" tem botão na página E entrada em /manuais. Muito mais ampla — exige varrer páginas, modais, headers.

**Recomendo A + B** (cobre 90% da confusão real). Se quiser estender pra C depois, abro outro plano.

### Decisão 2 — Como marcar visualmente?

**Opção 1** — Badge `⚠️` ou `2x` ao lado do label no sidebar. Limpo, varredura rápida.
**Opção 2** — Página dedicada `/admin/auditoria-duplicacoes` com tabela: console, item, rotas duplicadas, sugestão. Mais formal.
**Opção 3** — **Os dois** (recomendado): sinaliza no momento + relatório consolidado.

## Como vou executar (após sua resposta)

1. **Inventariar** todos os itens do `MENU_REGISTRY` agrupados por console (Root, Brand, Branch) — já sei que são ~80 entradas
2. **Detectar duplicações** por: mesma `url`, mesma `moduleKey`, ou nomes muito parecidos apontando pra rotas diferentes
3. **Criar utilitário** `src/compartilhados/utils/utilitarios_duplicacao_menu.ts` que retorna o conjunto de keys duplicadas
4. **Adicionar `<DuplicateBadge />`** nos itens duplicados dos 3 sidebars (visível só pra Root Admin por padrão)
5. **Criar página de relatório** `/admin/auditoria-duplicacoes` (acesso Root) com tabela: item, consoles, rota, módulo, severidade. Categorias: "Rota duplicada exata", "Mesma função, rotas diferentes", "Suspeita". **Sem remoção automática** — só sinalização.

## O que NÃO vou fazer

- ❌ Remover ou esconder qualquer item automaticamente
- ❌ Renomear rotas, mexer em RLS, edge functions ou banco
- ❌ Estender pra botões/modais dentro de páginas (Opção C) sem você confirmar

## Risco

Zero — só leitura + badges visuais + uma rota nova de relatório. Tudo reversível.

## Estimativa

~25 min após suas respostas.

---

**Para destravar:**
1. Escopo: A, B, **A+B (recomendado)**, ou A+B+C?
2. Sinalização: só badge, só relatório, ou **os dois (recomendado)**?

