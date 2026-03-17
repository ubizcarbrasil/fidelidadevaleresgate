

## Análise e Plano

### O que o usuário observou (screenshots)

1. **Grupo "Aprovações"** — "Solicitações de Upgrade" e "Validar Regras" aparecem visíveis para Ubiz Resgata, ambos vinculados ao módulo `earn_points_store`.
2. **Grupo "Programa de Fidelidade"** — O item "Pontuação por Tier" exibe a chave técnica `sidebar.tier_pontos` ao invés do título traduzido.

### Explicação: "Validar Regras"

A página **ApproveStoreRulesPage** (`/approve-store-rules`) permite que o Brand Admin **aprove ou rejeite regras de pontuação** configuradas por parceiros (lojas). Quando um parceiro define seu `points_per_real` no Portal do Parceiro, a regra fica com status `PENDING_APPROVAL` até o administrador da marca validar. É uma funcionalidade de governança do sistema multi-emissor.

### Explicação: "Solicitações de Upgrade"

A página **EmitterRequestsPage** (`/emitter-requests`) gerencia solicitações de parceiros que querem se tornar **emissores de pontos** (mudar `store_type` de RESGATADORA para EMISSORA/MISTA). Ou seja, é o fluxo de habilitar outros emissores — exatamente o que o usuário identifica como recurso avançado.

### Problemas identificados

1. **Módulo errado**: Ambos os itens de "Aprovações" usam `moduleKey: "earn_points_store"`, mas deveriam usar um módulo separado (ex: `multi_emitter`) já que são funcionalidades avançadas de múltiplos emissores, não do programa básico de fidelidade.
2. **Label quebrado**: O item `sidebar.tier_pontos` exibe a chave técnica porque não há entrada na tabela `menu_labels` para essa chave recém-adicionada.
3. **Visibilidade indevida**: Para planos básicos/entry, itens como "Caixa PDV", "Solicitações de Upgrade" e "Validar Regras" não deveriam aparecer.

### Plano proposto

#### 1. Criar módulo `multi_emitter` no banco
- Inserir nova `module_definition` com key `multi_emitter`, nome "Multi-Emissor", categoria `fidelidade`, `is_core: false`.
- **Não** habilitar por padrão para marcas entry/starter — apenas via ativação manual pelo ROOT.

#### 2. Atualizar moduleKey no BrandSidebar
- "Solicitações de Upgrade" → `moduleKey: "multi_emitter"`
- "Validar Regras" → `moduleKey: "multi_emitter"`
- "Caixa PDV" → manter `earn_points_store` (faz parte do programa básico) ou mover para `multi_emitter` conforme preferência

#### 3. Corrigir label `sidebar.tier_pontos`
- Inserir entrada na tabela `menu_labels` ou, mais simples, garantir que o `defaultTitle` ("Pontuação por Tier") seja exibido corretamente — investigar por que o hook `useMenuLabels` não está usando o fallback.

#### 4. Atualizar plan_module_templates
- Garantir que `multi_emitter` **não** esteja habilitado nos templates dos planos `free` e `starter`.
- Opcionalmente habilitar para `profissional` e `enterprise`.

### Resultado esperado
- Marcas entry/starter verão o "Programa de Fidelidade" (Pontuar, Regras, Tier, Extrato) mas **não** verão "Aprovações" (Solicitações de Upgrade, Validar Regras).
- O label "sidebar.tier_pontos" exibirá "Pontuação por Tier" corretamente.
- ROOT pode habilitar `multi_emitter` individualmente para marcas que precisam de múltiplos emissores.

