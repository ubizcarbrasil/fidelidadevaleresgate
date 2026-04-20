
# Corrigir a confusão “selecionei e mesmo assim ficou vazio” no wizard de Produtos Comerciais

## Diagnóstico

O comportamento atual está coerente com o código, mas a interface não explica bem o motivo:

- O passo 3 busca os módulos a partir dos vínculos da tabela `business_model_modules`
- Quando o usuário seleciona um modelo no passo 2 que está com **0 módulos vinculados** na Central de Módulos, o passo 3 mostra:
  - “Nenhum módulo vinculado a esses modelos”
- Ou seja: o problema não é o clique do usuário “não ter pegado”; o problema é que os modelos escolhidos no banco **não têm módulos configurados**

Pelas telas enviadas, isso está acontecendo exatamente com os modelos escolhidos.

## O que vou ajustar

### 1. Deixar isso explícito já no passo 2
Arquivo: `src/features/produtos_comerciais/components/passo_modelos.tsx`

Vou enriquecer a listagem de modelos para cada card mostrar:
- quantidade de módulos vinculados
- status visual:
  - “Pronto” quando tiver 1+ módulos
  - “Sem módulos” quando tiver 0

Também vou exibir um aviso logo abaixo da seleção quando houver modelos marcados sem vínculos, por exemplo:
- “Você selecionou 2 modelos, mas 1 deles não possui módulos configurados. Por isso o passo 3 pode ficar vazio.”

## 2. Bloquear avanço “cego” quando todos os modelos selecionados estiverem sem módulos
Arquivo: `src/features/produtos_comerciais/components/wizard_produto.tsx`

Hoje o passo 2 só valida:
- “tem ao menos 1 modelo?”

Vou reforçar a validação para também checar:
- “os modelos selecionados possuem algum módulo vinculado?”

Se todos estiverem zerados, o botão Próximo continua visível, mas ao clicar vai mostrar uma mensagem clara:
- “Os modelos selecionados ainda não possuem módulos configurados. Configure os vínculos na Central de Módulos ou escolha outro modelo.”

## 3. Tornar o passo 3 mais explicativo e auditável
Arquivo: `src/features/produtos_comerciais/components/passo_modulos.tsx`

Quando não houver módulos para renderizar, em vez de só mostrar um alerta genérico, vou exibir:
- a lista dos modelos selecionados
- quantos módulos cada um possui
- destaque visual nos que estão com 0
- orientação objetiva do tipo:
  - “Modelo X: 0 módulos”
  - “Modelo Y: 0 módulos”

Assim fica impossível parecer que “a seleção não funcionou”.

## 4. Criar atalho de correção para o lugar certo
Arquivos:
- `src/features/produtos_comerciais/components/passo_modelos.tsx`
- `src/features/produtos_comerciais/components/passo_modulos.tsx`

Vou adicionar uma ação direta para abrir a configuração correta:
- botão/atalho para `Central de Módulos`
- texto explicando que os vínculos são configurados em:
  - Catálogo de Modelos
  - edição do modelo
  - seção de vínculos com módulos

Isso reduz a sensação de travamento.

## 5. Melhorar o template para não parecer “quebrado”
Arquivo: `src/features/produtos_comerciais/constants/constantes_template.ts` e fluxo do wizard

Sem auto-marcar IDs fixos, vou melhorar a comunicação do template:
- indicar quais tipos de modelos ele espera
- informar que ele depende de modelos já configurados com módulos
- exibir uma observação específica quando o template for de motorista e os modelos selecionados estiverem zerados

## Resultado esperado

Depois da correção:

- no passo 2, você já enxerga quais modelos estão utilizáveis e quais estão “sem módulos”
- se escolher um modelo vazio, o sistema te avisa antes
- no passo 3, a tela explica exatamente por que nada apareceu
- você terá um caminho claro para corrigir a origem do problema na Central de Módulos

## Arquivos previstos

- `src/features/produtos_comerciais/components/passo_modelos.tsx`
- `src/features/produtos_comerciais/components/passo_modulos.tsx`
- `src/features/produtos_comerciais/components/wizard_produto.tsx`

Possivelmente também:
- um pequeno hook/utilitário local da feature para agregar contagem de módulos por modelo, mantendo a organização da feature

## O que não vou mexer

- não vou alterar banco nem RLS
- não vou mudar a lógica central de negócio
- não vou inventar seleção automática perigosa de módulos
- não vou mexer em `src/integrations/supabase/client.ts`

## Risco

Baixo. É principalmente melhoria de UX, validação e transparência do fluxo.

## Efeito prático

Você conseguirá distinguir claramente entre:
- “não selecionei direito”
- “selecionei um modelo vazio”
- “esse modelo ainda precisa ser configurado na Central de Módulos”
