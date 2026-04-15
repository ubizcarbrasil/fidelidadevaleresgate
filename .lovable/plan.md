
Objetivo: corrigir de verdade os dois problemas reportados no app do motorista:
- WhatsApp deve sumir quando a cidade estiver com esse acesso desligado
- “Compre com Pontos” deve mostrar produtos resgatáveis mesmo com Achadinhos desligado

Diagnóstico do código
1. A tela de configuração por cidade está com um ponto crítico no salvamento:
- `src/features/configuracao_cidade/hooks/hook_configuracao_cidade.ts`
- os `update()` são feitos sem `.select()`
- neste projeto isso é perigoso porque update com RLS pode falhar silenciosamente e aparentar “sucesso”
- hoje a UI já faz toast de sucesso e atualiza cache local mesmo sem garantir que a linha foi realmente alterada

2. O “Compre com Pontos” ainda depende da query errada:
- `DriverHomePage.tsx` e `DriverMarketplace.tsx` ainda buscam produtos a partir de uma lista filtrada por `visible_driver = true`
- depois filtram `is_redeemable`
- isso pode esconder produtos resgatáveis que existem para a loja de resgate, mas não devem aparecer na vitrine normal dos Achadinhos
- prova disso: `DriverRedeemStorePage.tsx` já usa outra lógica melhor, buscando direto por `is_redeemable = true`

3. O WhatsApp está parcialmente centralizado, mas o bug principal pode ser o save não persistindo de fato
- a exibição no app do motorista já depende de `whatsappNumber`
- se a configuração não grava no backend, o botão continua aparecendo no app

O que vou ajustar
1. Endurecer o salvamento da Configuração por Cidade
- em `hook_configuracao_cidade.ts`
- trocar os `update()` para `update(...).eq(...).select("id").single()`
- validar retorno real antes de exibir sucesso
- só atualizar cache local depois de confirmação real
- em erro, mostrar mensagem correta e não fingir que salvou

2. Separar definitivamente Achadinhos de Compre com Pontos
- em `DriverHomePage.tsx`
- em `DriverMarketplace.tsx`
- deixar a lista de “Achadinhos” vir da lógica de vitrine afiliada
- deixar a lista de “Compre com Pontos” vir de uma query própria baseada em `is_redeemable = true`
- não depender de `visible_driver` para os produtos de resgate
- manter filtro por cidade (`branch_id.eq.<cidade> OR branch_id.is.null`)

3. Garantir entrada visual quando só Compre com Pontos estiver ativo
- a Home e o Marketplace devem continuar mostrando:
  - seção “Resgatar com Pontos”
  - botão “Ver todos”
  - loja de resgate
- mesmo quando:
  - `enable_achadinhos_module = false`
  - `enable_points_purchase = true`

4. Manter o WhatsApp 100% subordinado à cidade
- preservar a resolução central no `DriverPanelPage.tsx`
- conferir que Home, Marketplace e overlay de informações usam apenas o valor filtrado
- se `enable_whatsapp_access = false`, o número final deve virar `undefined` em toda a experiência

Arquivos que entram na correção
- `src/features/configuracao_cidade/hooks/hook_configuracao_cidade.ts`
- `src/components/driver/home/DriverHomePage.tsx`
- `src/components/driver/DriverMarketplace.tsx`
- `src/pages/DriverPanelPage.tsx` (revisão final das flags)
- opcionalmente memória do projeto para registrar a regra definitiva

Resultado esperado
- WhatsApp desligado na cidade:
  - some da Home
  - some do Marketplace
  - some dos CTAs e links relacionados

- Achadinhos desligado + Compre com Pontos ligado:
  - categorias, busca e vitrine afiliada somem
  - produtos resgatáveis continuam aparecendo
  - loja de resgate continua acessível

Validação após implementar
1. Desligar WhatsApp na cidade e recarregar o app do motorista
2. Ligar apenas “Compre com Pontos” e confirmar que os produtos resgatáveis aparecem
3. Desligar Achadinhos e confirmar que só a vitrine afiliada some
4. Testar uma cidade com ambos ligados e outra com ambos desligados
