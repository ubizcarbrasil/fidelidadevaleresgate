

# Limpeza e unificação do menu lateral do Empreendedor

## Diagnóstico

Olhando os prints e o `BrandSidebar.tsx`:

1. **"Aprovações → Validar Regras"** aparece para a marca em modo Campeonato, mas só faz sentido para marcas que operam o módulo "Ganhe Pontos na Loja" (`earn_points_store`). Hoje o item já é filtrado por `moduleKey: "earn_points_store"`, mas como esse módulo está ativo nessa marca por outro motivo, ele "vaza" para o menu mesmo sem uso real no contexto Campeonato. Além disso, o grupo **Aprovações** está vazio ou quase vazio para essa marca, o que reforça a sensação de menu sem propósito.

2. **Não existe um item "Visão Geral"**. O Dashboard hoje aparece como um ícone solto no topo do menu (`LayoutDashboard`), sem rótulo de grupo nem título consistente com os demais itens. No mobile ele praticamente "desaparece" visualmente.

3. **"Guias Inteligentes" e "Manuais" são dois grupos separados**, mas conceitualmente fazem a mesma coisa (orientação/aprendizado). O grupo "Manuais" tem apenas 1 item dentro, o que é desperdício de espaço.

## O que vou ajustar

### 1. Adicionar item "Visão Geral" no topo do menu
- Criar um grupo enxuto **"Painel"** no topo, contendo apenas o item **"Visão Geral"**, que aponta para `/` (Dashboard).
- Manter o ícone `LayoutDashboard` e o comportamento atual (rota raiz).
- O item solto que existe hoje fora de qualquer grupo será removido para evitar duplicação.
- Resultado: o menu passa a abrir já mostrando **Painel → Visão Geral** de forma clara, no padrão dos demais itens.

### 2. Unificar "Guias Inteligentes" + "Manuais" em um único grupo "Guias & Manuais"
- Renomear o grupo `Guias Inteligentes` para **`Guias & Manuais`**.
- Mover o item `sidebar.manuais` para dentro desse grupo, logo abaixo de `Módulos`.
- Remover o grupo `Manuais` separado.
- Resultado: ordem dentro do grupo unificado:
  - Jornada do Empreendedor
  - Jornada do Emissor (quando aplicável)
  - Módulos
  - Manuais da Plataforma

### 3. Esconder "Aprovações" quando não há nada relevante
- Manter o item `Validar Regras` gated por `moduleKey: "earn_points_store"` (já existe).
- Adicionar uma regra extra: o grupo **"Aprovações"** só aparece se pelo menos um dos itens do grupo passou pelos filtros (`item.length > 0`). Essa lógica já existe (`if (group.items.length === 0) return null;`), então o grupo já some quando vazio — ou seja, o problema real é que `earn_points_store` está ligado mesmo em modo Campeonato.
- Vou adicionar um filtro adicional: para marcas em **modo Campeonato (`isCampeonato`)**, o item `sidebar.aprovar_regras` é ocultado mesmo se `earn_points_store` estiver ativo, porque a operação de validação manual de regras não se aplica ao formato Campeonato. Isso evita o vazamento que aparece no print.

### 4. Pequenos ajustes de consistência
- Garantir que o título "Visão Geral" também respeite o sistema de `useMenuLabels` (para que possa ser personalizado, igual aos demais).
- No mobile, o novo grupo "Painel" abre por padrão (ou já fica visível por estar no topo), facilitando o acesso rápido ao Dashboard.

## Arquivos que serão ajustados

- `src/compartilhados/constants/constantes_menu_sidebar.ts`
  - ajustar `defaultTitle` do `sidebar.dashboard` para **"Visão Geral"**.
- `src/components/consoles/BrandSidebar.tsx`
  - remover bloco que renderiza o Dashboard solto fora de grupo
  - adicionar grupo `"Painel"` no topo de `brandGroupDefs` contendo `sidebar.dashboard`
  - renomear grupo `"Guias Inteligentes"` para `"Guias & Manuais"` e incluir `sidebar.manuais` nele
  - remover o grupo `"Manuais"` independente
  - adicionar filtro condicional: se `isCampeonato`, esconder `sidebar.aprovar_regras`
- `src/hooks/useMenuLabels.ts`
  - garantir que o novo título "Visão Geral" seja respeitado como default do `sidebar.dashboard`

## Resultado esperado

- Menu mais limpo, com **Painel → Visão Geral** no topo.
- Um único grupo **Guias & Manuais** consolidando aprendizado e documentação.
- Grupo **Aprovações** desaparece automaticamente para marcas em modo Campeonato, eliminando o item sem sentido do print.
- Nenhuma rota é alterada — tudo continua funcionando, apenas a organização visual fica mais coerente.

## Risco e rollback

- **Risco baixo**: mudanças concentradas em definição de grupos e filtros visuais.
- **Rollback**: restaurar a definição anterior de `brandGroupDefs` e o bloco do Dashboard solto.

