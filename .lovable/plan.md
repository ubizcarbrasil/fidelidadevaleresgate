
Diagnóstico: sim, eu sei onde está o problema.

O travamento frequente não está vindo do dashboard da cidade em si nem dos 3 KPIs novos. Ele acontece no bootstrap inicial, antes da tela realmente montar. Pelos arquivos e pelos sinais de runtime:
- a tela fica presa no overlay do `index.html` (“preparando ambiente…”)
- o app só chega em `APP_MOUNTED` depois de ~6,6s
- depois que monta, `BRAND_READY` e `AUTH_READY` acontecem rápido
- isso indica que o gargalo principal está no carregamento/importação do app, não na autenticação nem na RPC do dashboard

O ponto mais forte da investigação:
- `App.tsx` ainda puxa um grafo inicial muito grande
- `WhiteLabelLayout` é importado cedo e traz o lado customer junto
- `WhiteLabelLayout.tsx` tem imports desnecessários (`CustomerAuthPage`, `PublicVouchers`) e importa `CustomerLayout` direto
- o perfil mostra muitos recursos carregados já no boot, inclusive bibliotecas pesadas que nem deveriam ser críticas na entrada

Plano de correção definitiva

1. Reduzir o peso do boot crítico
- Transformar o carregamento inicial em duas camadas:
```text
index.html overlay
  -> shell React mínima monta rápido
     -> overlay externo some
        -> app completo carrega com loader interno
```
- Objetivo: o usuário nunca mais ficar preso no overlay externo por causa do módulo inteiro.

2. Quebrar o `App.tsx` em shell leve + app pesado
- Manter no entry apenas o mínimo:
  - providers essenciais
  - `MountSignal`
  - roteamento mínimo
  - fallback interno
- Mover o resto para chunks lazy:
  - árvore principal de rotas admin
  - `AppLayout`
  - `WhiteLabelLayout`
  - blocos não críticos

3. Corrigir o acoplamento desnecessário do lado customer no boot admin
- Em `src/components/WhiteLabelLayout.tsx`:
  - remover imports não usados
  - lazy-load de `CustomerLayout`
- Isso evita carregar partes grandes do app customer quando o usuário só está entrando no painel admin/auth.

4. Tornar o bootstrap observável e resiliente
- Refinar fases em `bootStateCore` para separar:
  - shell montada
  - rotas carregadas
  - auth pronta
  - brand pronta
- Atualizar o fallback do `index.html` para mostrar fase real e não mascarar tudo como “preparando ambiente”.
- Manter reload automático apenas para erro de chunk; para lentidão, mostrar estado claro sem parecer travamento infinito.

5. Garantir que o overlay externo desapareça no momento certo
- Hoje ele depende do `MountSignal` dentro da árvore pesada.
- Vou reposicionar a estratégia para o sinal de montagem acontecer com uma shell mínima, antes de carregar o restante da aplicação.
- Resultado esperado: mesmo se dashboard/layout/customer demorarem, o usuário verá loader interno do app e não uma tela “morta”.

6. Limpar imports que aumentam o boot sem necessidade
Arquivos prioritários:
- `src/main.tsx`
- `src/App.tsx`
- `src/components/WhiteLabelLayout.tsx`
- `src/lib/lazyWithRetry.ts`
- `src/lib/bootStateCore.ts`
- `index.html`

7. Validação da correção
Vou considerar resolvido quando estes cenários estiverem estáveis:
- `/index` no mobile não fica preso em “preparando ambiente…”
- login abre sem travar
- painel branch continua carregando normalmente
- o overlay externo some cedo e qualquer demora restante aparece como loader interno do app
- nenhuma regressão em white-label, auth e rotas protegidas

Detalhes técnicos
- O último diff dos KPIs branch não parece ser a causa raiz.
- O problema é estrutural no boot, por isso ele “acontece com frequência”.
- Não precisa mudança de banco.
- A correção ideal é de arquitetura de entrada/performance, não de dados.

Implementação resumida
```text
main.tsx
  -> renderiza shell mínima
App.tsx
  -> vira orquestrador leve
Admin/WhiteLabel
  -> lazy
CustomerLayout
  -> lazy
index.html
  -> overlay apenas até shell montar
bootState
  -> fases mais precisas
```
