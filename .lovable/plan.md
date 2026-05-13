## Objetivo

Transformar o atual `CardAtivarCampeonato` (1 card simples → botão liga flag e some) em uma **landing de ativação premium e educativa**, e logo após ativar, abrir automaticamente um **wizard guiado de 3 passos** que leva o empreendedor da flag até a primeira temporada distribuída.

---

## Parte 1 — Tela de ativação (estado desativado)

Substituir o `CardAtivarCampeonato` atual por um bloco com **muito mais contexto**, dividido em 4 seções verticais (mobile-first, viewport 430px):

### 1.1 Hero
- Ícone `Trophy` grande dentro de gradient suave (usar tokens `primary` + `primary/10`).
- Título: "Campeonato Duelo Motorista"
- Subtítulo curto: "Transforme seus motoristas em competidores. Temporadas mensais, séries hierárquicas, prêmios reais."
- Badge "Recurso Premium" / "Recomendado".

### 1.2 Como funciona (3 cards em grid 1col mobile / 3col desktop)
Cada card com ícone + título + 1 linha:
- **Séries hierárquicas** (A, B, C, D…) — motoristas competem com pares de mesmo nível.
- **Classificação + Mata-mata** — fase de pontos seguida de duelos eliminatórios.
- **Hall da Fama público** — vencedores aparecem na vitrine da marca, gerando reconhecimento.

### 1.3 O que será habilitado (lista de checkmarks)
Lista visual com ícone `CheckCircle2`:
- Menu "Campeonato" no painel do empreendedor
- Card "Campeonato" no app do motorista (com inscrição)
- Distribuição automática de séries
- Editor de prêmios por temporada
- Cron de avanço de fases automatizado

### 1.4 Pré-requisitos / impacto (callout amber)
Um `Alert` informativo com `Info` icon listando:
- Não cancela operação atual; convive com Pontuação Padrão.
- Motoristas precisam ter foto de perfil para se inscrever.
- Recomendado configurar prêmios antes de iniciar a 1ª temporada.

### 1.5 CTA final
Botão grande primário "Ativar Campeonato" + link secundário "Ver demonstração" (opcional, pode ser link para doc futura — escopo: só placeholder `disabled` por enquanto, **não é prioridade**).

> Estado **ativado**: card compacto atual mantido (badge "Ligado" + botão Desativar com confirmação) — sem mudança.

---

## Parte 2 — Wizard guiado pós-ativação

Logo após `mutate({ habilitado: true })` ter sucesso, abrir automaticamente um `Dialog` (modo "wizard") com 3 passos numerados em stepper horizontal.

### Passo 1 — Confirmar formato de engajamento
- Mostra o `SeletorFormatoEngajamento` embutido (ou um resumo dele) já pré-selecionado em "Campeonato".
- Botão "Continuar".

### Passo 2 — Criar 1ª temporada
- Embute o conteúdo do `FormCriarTemporadaAutomatico` (modo Auto que já existe).
- Ao salvar com sucesso, avança automaticamente para o Passo 3.
- Botão "Pular por enquanto" disponível (fecha wizard, deixa empreendedor criar depois).

### Passo 3 — Distribuir motoristas
- Tela de sucesso com explicação: "Sua temporada foi criada. Falta 1 passo: distribuir os motoristas pelas séries."
- Botão "Distribuir agora" → dispara `useExecutarSeedingTemporada` e ao concluir abre `DistribuicaoManualView` (mesmo fluxo que `pagina_campeonato_empreendedor.tsx` já usa no CTA do dashboard).
- Botão "Distribuir depois" fecha wizard.

### Comportamento
- Wizard só abre **uma vez** após a ativação (controlado por estado local na `pagina_campeonato_empreendedor.tsx`, via callback `onAtivado` exposto pelo `CardAtivarCampeonato`).
- Pode ser fechado a qualquer momento (X no header) sem perder progresso real (cada passo já persiste seu próprio estado no banco).

---

## Estrutura de arquivos

Tudo dentro de `src/features/campeonato_duelo/components/empreendedor/ativacao/`:

```text
ativacao/
├── CardAtivarCampeonato.tsx          (substitui o atual; orquestra estados ON/OFF)
├── HeroAtivacao.tsx                  (seção 1.1)
├── ComoFuncionaCards.tsx             (seção 1.2)
├── ChecklistRecursosAtivados.tsx     (seção 1.3)
├── AlertaPreRequisitos.tsx           (seção 1.4)
├── CardAtivacaoCompacto.tsx          (estado ativado, extraído do atual)
└── wizard/
    ├── WizardPosAtivacao.tsx         (Dialog + stepper + roteamento entre passos)
    ├── PassoFormato.tsx
    ├── PassoCriarTemporada.tsx
    └── PassoDistribuir.tsx
```

`pagina_campeonato_empreendedor.tsx`: adiciona `useState` `wizardAberto`, passa `onAtivado={() => setWizardAberto(true)}` para o card e renderiza `<WizardPosAtivacao open={wizardAberto} ... />`.

---

## Detalhes técnicos

- **Sem mudanças no banco** — wizard apenas reaproveita hooks/RPCs existentes (`useAlterarAtivacaoCampeonato`, `useFormatoEngajamento`, `useCriarTemporadaCompleta`, `useExecutarSeedingTemporada`).
- **Design tokens** — usar `bg-primary`, `text-primary`, `border-primary/30`, `bg-primary/5`, `bg-muted/30`. Nada de cores hardcoded. Dark mode via tokens.
- **Mobile-first 430px** — grids `grid-cols-1 sm:grid-cols-3`. Wizard usa `Dialog` full-screen no mobile (`sm:max-w-2xl` desktop).
- **Stepper** — componente local simples (3 círculos numerados ligados por linha), sem nova dependência.
- **Accessibility** — botões com `aria-label`, `Dialog` com título/descrição, `disabled` durante mutations.
- **Persistência do "wizard já visto"** — opcional: gravar `brand_settings_json.duelo_wizard_concluido = true` para não reabrir, mas neste escopo basta o estado local (só dispara após click manual em "Ativar").

---

## Fora de escopo
- Mudanças em RPC, migrations, schemas.
- Alterar o `FormCriarTemporadaAutomatico` em si (apenas reusar).
- Mudar o card compacto do estado "ativado" além de extrair para `CardAtivacaoCompacto.tsx`.
- Página de demonstração / vídeo institucional.
