

## Plano: Adicionar botão "Recalcular Pontos" na página Conversão por Público

### O que será feito
Importar e reutilizar o componente `BotaoRecalcularPontos` já existente em `src/pages/produtos_resgate/components/BotaoRecalcularPontos.tsx` dentro da página `pagina_conversao_resgate.tsx`. Esse botão já busca as taxas por público e recalcula todos os produtos.

### Mudanças em `src/pages/conversao_resgate/pagina_conversao_resgate.tsx`

1. **Importar** o componente `BotaoRecalcularPontos`
2. **Posicionar** o botão ao lado do botão "Salvar Taxas" no header da página, para que após salvar as novas taxas o empreendedor possa recalcular todos os produtos com um clique

### Resultado
- Após ajustar as taxas de conversão, o empreendedor clica em "Recalcular Pontos" na mesma tela
- Todos os produtos resgatáveis têm seus custos em pontos atualizados automaticamente
- Um arquivo alterado

