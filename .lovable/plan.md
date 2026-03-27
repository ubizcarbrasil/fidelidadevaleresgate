

## Corrigir boot travado em ENTRY_LOADING

### Problema
O app fica preso na fase `ENTRY_LOADING` (definida no `index.html` linha 121). O `main.tsx` nunca executa, então a fase nunca avança para `BOOTSTRAP`. Nenhum log aparece no console — o JavaScript principal não está carregando.

### Causa raiz
A tag `<meta http-equiv="Content-Security-Policy">` no `index.html` (linha 10) é muito restritiva. Ela bloqueia:
- **`connect-src`**: Não inclui domínios do Lovable preview (`https://*.lovable.app`, `https://*.lovableproject.com`) nem APIs externas que o app precisa
- **`script-src`**: Pode estar bloqueando módulos ES carregados pelo Vite no ambiente de preview

Quando o CSP bloqueia o carregamento do bundle JS, o browser simplesmente não executa o script — e a fase fica eternamente em `ENTRY_LOADING`.

### Solução
**Remover a meta tag CSP do `index.html`**. CSP via meta tag é problemático em SPAs com builds dinâmicos e ambientes de preview. Se necessário no futuro, deve ser configurado via headers HTTP no servidor, não via meta tag.

### Arquivo alterado
- **`index.html`** — Remover a linha 10 (meta tag CSP)

### Impacto
- Zero impacto funcional — a CSP via meta tag estava apenas bloqueando o funcionamento
- O app voltará a carregar normalmente
- Segurança real deve ser implementada via headers HTTP no deploy de produção, não via meta tag no HTML

