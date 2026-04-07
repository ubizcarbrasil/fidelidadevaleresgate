

## Plano: Reposicionar "Adicionar Cidade" na aba Pontuar Motorista

### Problema
O card de adicionar cidade fica no final da página, após diagnóstico e eventos em tempo real, dificultando o acesso — especialmente em mobile.

### Mudanças

**Arquivo: `aba_pontuar_motorista.tsx`**

1. **Sem cidades ativas** (`activeIntegrations.length === 0`): Mover o `CardAdicionarCidade` para logo após o Alert explicativo, antes de qualquer outro conteúdo. Não renderizar o card novamente no final.

2. **Com cidades ativas** (`activeIntegrations.length > 0`): Adicionar um botão de atalho (ex: `+ Adicionar cidade`) logo após o Alert explicativo, que ao ser clicado faz scroll suave até o `CardAdicionarCidade` no final da página usando um `useRef`.

### Detalhes técnicos
- Criar um `ref` (`addCidadeRef`) vinculado ao `CardAdicionarCidade`
- Botão de atalho usa `addCidadeRef.current?.scrollIntoView({ behavior: "smooth" })`
- Lógica condicional controla a posição do card e a visibilidade do botão
- Nenhum arquivo novo necessário — apenas edição de `aba_pontuar_motorista.tsx`

