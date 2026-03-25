
## Diagnóstico: por que a tela fica branca “do nada”

Sim. Agora eu sei o que está acontecendo.

A tela branca não está vindo mais do bootstrap de autenticação. O problema atual é a combinação de **2 falhas diferentes**:

1. **Falha de carregamento de chunks/lazy imports**
   - Os logs já registraram erros como:
     - `Importing a module script failed`
   - Como o app usa muitas páginas com `lazy(() => import(...))` em `src/App.tsx`, quando o preview recompila ou publica uma nova versão, o navegador às vezes tenta abrir um chunk antigo que já não existe mais.
   - Resultado: o React nem sempre consegue montar a rota corretamente e você percebe como “tela branca”.

2. **Erros de runtime em rotas específicas**
   - Os logs também mostram crashes reais em páginas:
     - `/driver-config` → `ReferenceError: Can't find variable: SortableCategoryItem`
     - `/` → já houve `ReferenceError: productionUrl`
   - Ou seja: além do problema de chunk, existem páginas que em algum momento quebram em runtime. Quando isso acontece, a experiência fica parecendo instável e intermitente.

## O que isso significa em linguagem simples

Não é “a rota /index”.
Não é “só cache”.
Não é “só autenticação”.

É um app com:
- muitas rotas lazy
- preview recompilando com frequência
- e algumas páginas que, quando quebram, derrubam a renderização

Isso explica por que às vezes funciona e às vezes vira tela branca.

## Plano para resolver de forma definitiva

### 1. Blindar os imports lazy contra chunks quebrados
**Arquivo principal:** `src/App.tsx`

Vou:
- criar um helper tipo `lazyWithRetry`
- trocar os `lazy(() => import(...))` críticos por versão com retry
- quando ocorrer erro de chunk/module import, tentar 1 recuperação controlada
- evitar loop infinito de reload

Objetivo:
- quando o preview/build trocar os arquivos, a app se recupera em vez de morrer em branco

### 2. Melhorar fallback para erro de import
**Arquivos:**
- `src/components/ErrorBoundary.tsx`
- possivelmente `src/main.tsx`

Vou:
- detectar especificamente erros como `Importing a module script failed`
- mostrar mensagem útil com botão de recarregar
- evitar fallback genérico “silencioso”

Objetivo:
- se algo quebrar, aparece erro tratável, não tela branca muda

### 3. Colocar um fallback visual antes do React montar
**Arquivos:**
- `index.html`
- `src/main.tsx`

Vou:
- adicionar um shell/fallback mínimo no HTML
- remover esse fallback assim que o React montar com sucesso

Objetivo:
- mesmo se o bundle principal falhar, nunca mais ficar “tela totalmente branca”

### 4. Corrigir rotas já sinalizadas pelos logs
**Arquivos mais prováveis:**
- `src/pages/DriverPanelConfigPage.tsx`
- `src/pages/Dashboard.tsx`
- qualquer página recentemente alterada ligada ao erro registrado

Vou:
- revisar os componentes usados nessas páginas
- eliminar referências soltas/instáveis
- garantir que uma página quebrada não derrube a navegação inteira

Objetivo:
- remover os crashes reais que estão aparecendo no backend

### 5. Isolar melhor falhas por rota
**Arquivos:**
- `src/App.tsx`
- possivelmente wrappers de página

Vou:
- aplicar boundaries mais perto das páginas mais sensíveis
- impedir que uma rota com erro derrube toda a aplicação

Objetivo:
- se uma página falhar, o resto do sistema continua funcionando

## Arquivos que devo mexer
- `src/App.tsx`
- `src/components/ErrorBoundary.tsx`
- `src/main.tsx`
- `index.html`
- `src/pages/DriverPanelConfigPage.tsx`
- possivelmente `src/pages/Dashboard.tsx`

## Resultado esperado
Depois disso:
- o preview para de morrer por chunk velho
- o app deixa de ficar branco quando uma rota lazy falhar
- erros de página passam a aparecer de forma controlada
- mesmo em falha de bootstrap, o usuário vê um fallback, não uma tela vazia

## Resumo técnico
```text
Causa real:
1) falha intermitente de lazy chunks após rebuild/deploy
2) crashes reais em algumas rotas

Correção:
- lazy import com retry
- fallback visual de bootstrap
- error boundary específico para chunk load
- corrigir páginas com erro real
- isolar falhas por rota
```
