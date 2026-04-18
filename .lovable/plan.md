

## Diagnóstico — 2 problemas distintos

### Problema 1: Abas "Empreendedores" e "Cidades" não aparecem no preview
**Confirmado via leitura do código:** `pagina_central_modulos.tsx` declara as 4 abas (linhas 30-33), os 4 componentes existem no disco (`aba_empreendedores.tsx` linha 118, `aba_cidades.tsx` linha 104). O preview mostra só 2 — é **cache de bundle antigo no CDN do Lovable** (mesmo problema da "Fase 4.1b" registrado no histórico).

### Problema 2: Toggle de módulo não desativa no painel do empreendedor
Sem ter acesso às abas Empreendedores/Cidades, o usuário só consegue mexer no **Catálogo** (aba 1), que controla `module_definitions.is_active`. Mas o `useResolvedModules` (cascata cidade > marca > is_core) **não consulta `is_active`** — ele resolve via `brand_modules` + `city_module_overrides`. Então desativar pelo catálogo **não esconde nada** no painel do empreendedor por design — é preciso desativar em "Empreendedores".

Ou seja: o "bug" é consequência do Problema 1. Sem as abas certas, o root está mexendo no lugar errado.

## Plano de correção

### Passo 1 — Forçar invalidação do cache de bundle (resolve as 4 abas)
Adicionar um marcador de versão visível no header da página + tocar em cada chunk-filho para forçar novo hash:
- `pagina_central_modulos.tsx`: bump do `BUILD_TAG` para `v3` + ajuste do título responsivo
- `aba_catalogo.tsx`, `aba_planos.tsx`, `aba_empreendedores.tsx`, `aba_cidades.tsx`: adicionar constante `CHUNK_VERSION` no topo de cada arquivo (1 linha) para mudar o hash do chunk e invalidar CDN

Isso replica a estratégia documentada como "Fase 4.1b — Tentativa 2" no histórico.

### Passo 2 — Verificar `aba_catalogo.tsx` no mobile
A imagem mostra que em 430px o usuário só vê 2 abas porque `grid-cols-2 md:grid-cols-4` quebra em 2 colunas. Mas deveria mostrar 4 botões em **2 linhas**. Vou verificar se está mesmo cortando ou se é só cache. (Provavelmente é cache, porque o conteúdo abaixo já é o do Catálogo expandido — sem a segunda linha visível.)

Ajuste defensivo: trocar `grid-cols-2 md:grid-cols-4` por `flex flex-wrap` ou `grid-cols-4` direto, garantindo que as 4 abas apareçam visíveis em mobile mesmo com cache parcial.

### Passo 3 — Garantir consistência de `is_active`
Validar (read-only) se módulo desativado no Catálogo (`module_definitions.is_active = false`) deveria também esconder do empreendedor. Se sim, ajustar a RPC `resolve_active_modules` ou adicionar filtro no frontend. Isso é uma decisão de produto que vou documentar no plano para o usuário aprovar antes de mexer.

### Passo 4 — Adicionar nota visual de orientação
Na aba "Empreendedores" e "Cidades" adicionar um banner explicativo de 1 linha indicando: *"Esta é a tela onde você liga/desliga funcionalidades por marca (cascata: Catálogo → Empreendedor → Cidade)."* — ajuda a evitar confusão futura sobre qual aba usa pra quê.

## Arquivos a editar

| Arquivo | O quê |
|---|---|
| `src/features/central_modulos/pagina_central_modulos.tsx` | Bump build tag + grid responsivo robusto |
| `src/features/central_modulos/components/aba_catalogo.tsx` | Constante de chunk version (1 linha) |
| `src/features/central_modulos/components/aba_planos.tsx` | Constante de chunk version |
| `src/features/central_modulos/components/aba_empreendedores.tsx` | Constante chunk + banner explicativo |
| `src/features/central_modulos/components/aba_cidades.tsx` | Constante chunk + banner explicativo |

## Pergunta única antes de executar

**Sobre o Catálogo (aba 1) — o que você espera quando desativa um módulo lá?**

- **A:** Desativar no Catálogo = removê-lo de TODAS as marcas e cidades automaticamente (ação destrutiva, afeta os 42 usuários). Útil quando uma feature está sendo descontinuada.
- **B:** Desativar no Catálogo = só esconder do menu de "Novo Módulo" e da listagem de admin, **não afeta** marcas que já têm o módulo ativo. (comportamento atual). Quem mexe no que cada marca vê é a aba "Empreendedores".
- **C:** Não desativar pelo Catálogo — só usar para criar/editar definições. Mover o toggle de ativo/inativo só para a aba "Empreendedores".

Sua resposta define se o Passo 3 vira correção (A) ou só documentação visual (B/C).

