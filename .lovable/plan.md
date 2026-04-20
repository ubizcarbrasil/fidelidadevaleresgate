

# Por que o passo 3 ficou em branco — e como corrigir

## Diagnóstico (o que aconteceu na sua tela)

O wizard funcionou exatamente como foi programado, mas a UX falhou em explicar:

1. Você clicou em **"Usar template"** → o template (Vale Resgate Motorista Premium) preencheu o passo 1
2. O **banner azul** no topo já avisava: *"selecione manualmente os modelos de negócio (passo 2) e módulos (passo 3)"* — mas é fácil passar batido
3. Você pulou o **passo 2 (Modelos)** sem marcar nenhum modelo de negócio
4. No **passo 3 (Funcionalidades)**, o componente faz: *"pegar todos os módulos obrigatórios dos modelos selecionados"* — como nenhum modelo foi selecionado, **a lista veio vazia**, mas a tela só mostrou o subtítulo "Funcionalidades obrigatórias dos modelos selecionados são pré-marcadas" sem nenhuma explicação visível
5. O botão **"Próximo"** ainda ficou ativo, dando a sensação de que está tudo certo

Resumo: **template pré-preenche identificação, mas não pré-seleciona modelos** (de propósito — modelos dependem do escopo do produto). E o passo 3 não avisa quando está vazio porque o passo 2 está vazio.

## O que vou corrigir

### 1. `src/features/produtos_comerciais/components/wizard_produto.tsx`
- **Bloquear avanço do passo 1 → 2** já validando o que precisa
- **Validar passo 2 antes de chegar no 3**: se `business_model_ids.length === 0`, o `next()` já bloqueia (isso já existe — vou reforçar exibindo um toast mais claro)
- Adicionar **indicador visual de "passo incompleto"** no stepper (bolinha vermelha ou ícone de alerta) quando o passo tem pendência

### 2. `src/features/produtos_comerciais/components/passo_modulos.tsx` (a tela que ficou em branco)
Adicionar um **estado vazio explícito** quando `draft.business_model_ids.length === 0`:

```
┌─────────────────────────────────────────┐
│  ⚠️  Volte ao passo 2 e selecione        │
│      ao menos um Modelo de Negócio      │
│                                          │
│  As funcionalidades obrigatórias e       │
│  opcionais aparecem aqui assim que       │
│  você escolher os modelos.               │
│                                          │
│        [ ← Voltar ao passo 2 ]           │
└─────────────────────────────────────────┘
```

E quando há modelos selecionados mas **zero módulos vinculados** no banco (caso raro), mostrar:
*"Nenhum módulo vinculado a esses modelos. Selecione opcionais abaixo ou volte ao passo 2."*

### 3. `src/features/produtos_comerciais/components/passo_modelos.tsx` (passo 2)
Quando o usuário **chegou aqui via template**, mostrar um destaque visual no topo:

```
✨ Sugestão para "Vale Resgate Motorista Premium":
   marque os modelos voltados para Motorista
   (audience = DRIVER) — eles dão acesso aos
   módulos do painel do motorista.
```

Não auto-marca nada (mantém controle manual), só orienta.

### 4. Stepper visual com ícone de alerta
No `wizard_produto.tsx`, o stepper passa a destacar com 🔴 / ícone `AlertCircle` os passos com pendência (`business_model_ids` vazio = passo 2 incompleto).

## O que NÃO vou fazer

- ❌ Não vou auto-selecionar modelos pelo template (você é quem decide o escopo do produto)
- ❌ Não vou mudar a regra de "obrigatórios vêm dos modelos" — está correta
- ❌ Não vou mexer em banco, RLS, edge functions, rotas
- ❌ Não vou desbloquear o botão Próximo no passo 2 (a validação já existe e está certa)

## Resultado esperado

Cenário 1 — você abre o template e pula o passo 2:
- Passo 2: stepper mostra ⚠️ no número 2
- Passo 3: tela mostra card vermelho "Volte ao passo 2", impossível confundir

Cenário 2 — você seleciona 1+ modelo no passo 2:
- Passo 3: lista de módulos obrigatórios aparece pré-marcada (como já funciona hoje)

## Risco / Reversão

Risco zero — só ajustes visuais e mensagens. `npx tsc --noEmit` esperado limpo. Reversão = remover os estados vazios.

## Estimativa

~10 min.

