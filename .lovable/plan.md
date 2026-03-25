
Diagnóstico atualizado

Do I know what the issue is? Sim.

O problema mais provável agora não é mais autenticação, BrandContext nem chunk lazy.

O que os dados mostram:
- No navegador remoto, `/index` carrega os scripts, executa `main.tsx` e termina em `/auth` normalmente.
- Então o app consegue montar; o problema não é “bundle quebrado”.
- O `manifest.json` com `401` aparece nos logs, mas é ruído de preview/PWA e não explica o travamento do app.
- O travamento continua só no preview embutido/intermitente, o que aponta para condição de corrida no bootstrap.

Causa raiz mais provável

Hoje o fallback está dentro de `#root` em `index.html`, e `src/main.tsx` faz isso:

```ts
createRoot(rootEl).render(<App />);
if (fallback) fallback.remove();
```

Em React 18, `render()` não garante commit síncrono da árvore antes da próxima linha. Então o código está:
1. mandando React montar dentro de `#root`
2. mexendo manualmente no DOM que React acabou de assumir
3. às vezes antes da montagem concluir

Isso pode deixar o preview preso no fallback/spinner ou em estado inconsistente, principalmente no iframe/mobile preview, mesmo quando o app funciona em outra sessão.

Em resumo:
```text
Não é mais “loading infinito do app”.
É uma corrida entre:
- fallback HTML estático
- React assumindo o #root
- remoção manual do fallback cedo demais
```

Plano de correção

1. Separar o fallback do container React
Arquivos:
- `index.html`

Mudança:
- tirar `#bootstrap-fallback` de dentro do `#root`
- deixar:
```html
<div id="bootstrap-fallback"></div>
<div id="root"></div>
```

Por quê:
- React passa a controlar só o `#root`
- o fallback vira overlay/shell externo
- elimina disputa de ownership do mesmo DOM node

2. Trocar “remoção imediata” por handshake real de mount
Arquivos:
- `src/main.tsx`
- wrapper mínimo de sinalização (se necessário)

Mudança:
- parar de remover o fallback logo após `render(<App />)`
- sinalizar “app montou” só depois de um `useEffect`/`useLayoutEffect` rodando dentro da árvore React
- só então esconder/remover o fallback

Por quê:
- garante que o fallback só sai quando a interface realmente assumiu a tela

3. Manter timeout, mas só no overlay externo
Arquivos:
- `index.html`

Mudança:
- preservar spinner + botão “Recarregar”
- timeout continua existindo, mas agindo sobre o overlay externo
- se a app montar, o overlay some
- se não montar, o usuário vê recuperação clara

Por quê:
- evita spinner eterno sem voltar a criar corrida com React

4. Simplificar o bootstrap de `main.tsx`
Arquivos:
- `src/main.tsx`

Mudança:
- manter proteção com `try/catch`
- remover manipulação prematura do fallback dentro do fluxo principal
- deixar `window.__APP_MOUNTED__` ser marcado pelo sinalizador interno da app, não pela linha logo após `render()`

Por quê:
- hoje esse flag está sendo usado cedo demais para um processo assíncrono

5. Validar especificamente o cenário que está quebrando
Validação:
- abrir `/index` no preview mobile
- confirmar que sai do fallback e chega em `/auth`
- confirmar que `/` redireciona corretamente quando não há sessão
- confirmar que não existe mais caso onde o overlay fica preso enquanto o app já poderia montar
- confirmar que o `401` do manifest não impacta o fluxo principal

Arquivos que eu alteraria
- `index.html`
- `src/main.tsx`
- possivelmente um wrapper mínimo em `src/App.tsx` ou componente bem pequeno só para sinalizar “mount concluído”

Por que isso deve resolver de verdade

Porque agora o bug mais provável não está “dentro da app”, e sim na transição entre HTML estático e React.

A correção anterior blindou:
- storage
- chunk retry
- timeout visual

Mas ainda deixou um ponto frágil:
- fallback e React compartilhando o mesmo `#root`
- remoção manual logo após `render()`

A próxima correção ataca exatamente isso.

Resumo técnico
```text
Evidência:
- app monta no navegador remoto
- /index -> /auth funciona
- scripts carregam
- fallback ainda trava no preview do usuário

Problema real:
- race condition no bootstrap
- fallback dentro do #root
- remoção manual cedo demais após createRoot().render()

Correção:
- fallback fora do #root
- sinalização de mount feita de dentro do React
- remover overlay só após mount real
- manter timeout apenas como recuperação
```
