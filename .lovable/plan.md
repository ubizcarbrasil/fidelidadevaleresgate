

## Problema

O parser da edge function `mirror-sync` não extrai preços nem nome da loja porque:

1. **Preços**: O regex de texto (linha 78) busca apenas tags `<p>`, `<span>`, `<h1-6>`, mas os preços no HTML do Divulgador Inteligente estão dentro de `<div>` (ex: `<div class="sc-a1e0a9be-...">R$ 134,89</div>`)
2. **Loja**: O parser não tenta extrair o nome da loja, que está disponível em links para `/lojas/mercadolivre`
3. **Badge**: Todos os cards estão vindo com badge "100%" em vez do desconto real — o regex pega texto "100%" de algum elemento antes de achar o desc