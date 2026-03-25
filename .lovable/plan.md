
Diagnóstico atualizado

O que você está vendo agora não parece mais ser o spinner do `BrandContext`. A captura mostra o spinner roxo do `#bootstrap-fallback` do `index.html`, ou seja: o preview fica preso antes de a aplicação assumir a tela por completo.

O que eu confirmei no código
- `index.html` renderiza um fallback estático roxo (`#bootstrap-fallback`).
- `src/main.tsx` remove esse fallback imediatamente antes de `createRoot(...).render(<App />)`.
- No navegador remoto, a rota chegou a carregar a tela de login normalmente, então o app em si consegue montar.
- No seu preview, porém, o fallback continua visível, o que indica falha/interrupção no bootstrap dessa sessão específica: bundle inicial não assumiu a tela, ou a montagem não concluiu de forma confiável.

Causa raiz mais provável
- A correção anterior blindou lazy imports e loading contexts, mas não blindou o bootstrap inicial da entrada (`index.html` + `main.tsx`) quando o preview fica numa sessão inconsistente.
- Hoje o fallback só “gira”; ele não detecta falha de entrada, não expõe ação de recuperação e não espera confirmação real de que o React montou.

Plano de correção mínima e conservadora

1. Tornar o bootstrap verificável
- Ajustar `src/main.tsx` para não tratar “arquivo carregado” como sinônimo de “app montou”.
- Marcar explicitamente quando a app realmente montar com sucesso.
- Remover o fallback apenas depois dessa confirmação, não só antes do `render()`.

2. Melhorar o fallback estático do `index.html`
- Manter o visual atual, mas transformar o fallback em um estado de bootstrap inteligente.
- Se a app não sinalizar montagem em alguns segundos, trocar o spinner infinito por mensagem curta + botão de recarregar.
- Isso evita que o usuário fique preso indefinidamente numa tela muda.

3. Proteger o entrypoint
- Envolver a montagem inicial em tratamento de erro no `src/main.tsx`.
- Se der erro no bootstrap, registrar no console e atualizar o fallback com estado de erro recuperável.
- Isso cobre falha antes mesmo de qualquer rota/provider assumir a renderização.

4. Garantir compatibilidade com `/index`
- Manter a normalização atual de `/index` para `/`.
- Validar que o handshake de montagem continua funcionando tanto em `/index` quanto em `/`.

Arquivos a alterar
- `index.html`
- `src/main.tsx`

Validação que farei depois da implementação
- Confirmar que o spinner some quando a app monta com sucesso.
- Confirmar que, se o bootstrap falhar, aparece mensagem útil em vez de spinner eterno.
- Confirmar que `/index` e `/auth` continuam carregando sem regressão.
- Confirmar que a recuperação exige no máximo um recarregamento manual e não entra em loop.

Por que isso deve resolver
- O problema atual está no limbo entre HTML estático e montagem real do React.
- A correção anterior reduziu telas brancas dentro da app; esta próxima correção ataca o estágio anterior, onde o preview ainda nem conseguiu “entregar” a aplicação para o usuário.
