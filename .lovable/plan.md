
Objetivo: corrigir o caso real que encontrei no código e no banco para que “Compre com Pontos” continue visível mesmo com Achadinhos desligado.

Diagnóstico confirmado
- Para o motorista do print (`Maurides Mariano Batista`), a cidade atual é `Araxá - MG`.
- No banco, essa cidade está com:
  - `enable_achadinhos_module = false`
  - `enable_points_purchase = true`
- Também existem vários produtos ativos com `is_redeemable = true` para essa marca.
- Ou seja: o problema agora não é persistência da configuração nem falta de produto. É renderização/fluxo no front.

Causa raiz mais provável no código atual
- `DriverMarketplace.tsx` já está quase desacoplado corretamente.
- Mas `DriverHomePage.tsx` ainda ficou com lógica antiga/inconsistente:
  - ainda recalcula WhatsApp localmente
  - ainda mantém query de vitrine acoplada ao `achadinhosEnabled`
  - não usa a mesma centralização final de permissões do `DriverPanelPage`
- Resultado: quando Achadinhos desliga, partes da experiência do motorista ainda seguem a regra antiga e o bloco de “Compre com Pontos” some da navegação/entrada visual.

O que será ajustado
1. Centralizar de verdade as permissões finais no `DriverPanelPage.tsx`
- Tratar `achadinhosEnabled`, `marketplaceEnabled` e `whatsappNumber` como fonte única.
- Passar `whatsappNumber` também para `DriverHomePage`.
- Garantir que nenhum filho recalcule toggle por conta própria.

2. Corrigir `DriverHomePage.tsx`
- Remover a lógica local de WhatsApp.
- Receber `whatsappNumber` por prop.
- Ajustar a lógica para que “Resgatar com Pontos” dependa somente de:
  - `marketplaceEnabled`
  - existência de produtos resgatáveis
- Garantir que a seção continue aparecendo mesmo com `achadinhosEnabled = false`.

3. Revisar o fluxo Home → Marketplace
- Garantir que, quando só “Compre com Pontos” estiver ativo, o motorista ainda tenha entrada visual clara para a loja de resgate.
- Se necessário, manter o clique de “Ver todos” e abertura da loja de resgate totalmente independentes do ecossistema Achadinhos.

4. Revisão final no `DriverMarketplace.tsx`
- Confirmar que nenhuma condição residual ainda esconde a seção de resgate quando Achadinhos está desligado.
- Manter:
  - busca/categorias/ofertas afiliadas só com Achadinhos
  - “Resgatar com Pontos” só com `marketplaceEnabled`

Arquivos que precisam de ajuste
- `src/pages/DriverPanelPage.tsx`
- `src/components/driver/home/DriverHomePage.tsx`
- `src/components/driver/DriverMarketplace.tsx`

Validação após implementar
- Cidade com `Achadinhos = OFF` e `Compre com Pontos = ON`
  - deve mostrar “Resgatar com Pontos”
  - deve abrir a loja de resgate normalmente
  - não deve mostrar categorias/busca/ofertas afiliadas
- Cidade com `Achadinhos = ON` e `Compre com Pontos = ON`
  - ambos os blocos coexistem
- Cidade com ambos OFF
  - nada de Achadinhos nem resgate
- Verificar no celular com o mesmo motorista do print

Observação importante
- No caso específico do motorista dos prints mais recentes, o banco confirma que `Compre com Pontos` está ligado e há produtos resgatáveis disponíveis. Então a próxima correção é 100% no front, não na configuração.
