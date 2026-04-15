<final-text>Objetivo: corrigir de forma definitiva os 2 problemas no app do motorista:
- WhatsApp continua aparecendo mesmo desativado na cidade
- “Compre com Pontos” ainda some quando Achadinhos está desligado

Diagnóstico confirmado

1. O bug do “Compre com Pontos” não está só no front
- O front já separou parte da UI, mas as queries do motorista ainda leem `affiliate_deals` sob acesso público.
- Hoje a política pública de leitura libera apenas itens com `visible_driver = true`.
- Isso bloqueia produtos de resgate (`is_redeemable = true`) que não estão visíveis na vitrine normal de Achadinhos.
- Resultado: mesmo com `enable_points_purchase = true`, a lista volta vazia e a seção some.

2. O bug do WhatsApp vem de inconsistência na leitura das flags
- A tela de Configuração por Cidade lê toggle como `=== true`:
  - valor ausente = OFF na UI
- O app do motorista lê várias flags como `!== false`:
  - valor ausente = ON no runtime
- Isso cria falso desligado no admin e falso ligado no app.
- Esse descompasso afeta principalmente `enable_whatsapp_access` e também pode confundir Achadinhos / Compre com Pontos.

Arquivos que precisam entrar na correção
- `src/pages/DriverPanelPage.tsx`
- `src/features/configuracao_cidade/hooks/hook_configuracao_cidade.ts`
- `src/components/driver/home/DriverHomePage.tsx`
- `src/components/driver/DriverMarketplace.tsx`
- `src/components/driver/DriverRedeemStorePage.tsx`
- nova migration em `supabase/migrations/...`

O que vou implementar

1. Unificar a regra das flags por cidade
- Criar um resolvedor único para:
  - `enable_achadinhos_module`
  - `enable_points_purchase`
  - `enable_marketplace_module`
  - `enable_whatsapp_access`
- Usar exatamente a mesma regra:
  - na tela de Configuração por Cidade
  - no `DriverPanelPage`
- Assim o que o admin vê passa a ser exatamente o que o motorista recebe.

2. Corrigir a persistência/visualização da Configuração por Cidade
- Manter o save endurecido com `.select("id").single()`
- Ajustar a leitura do `useConfiguracaoCidade` para não mostrar OFF quando a regra real daquela flag for ON por padrão
- Se necessário, explicitar os booleanos salvos para eliminar ambiguidade em cidades antigas

3. Desacoplar “Compre com Pontos” de vez no backend de leitura
- Atualizar a política pública de leitura de `affiliate_deals` para permitir também:
  - produtos `is_redeemable = true`
  - voltados ao motorista (`redeemable_by in ('driver', 'both')`, quando aplicável)
- Isso remove a dependência indevida de `visible_driver = true` para produtos de resgate

4. Ajustar as queries do motorista para usar a regra correta
- `DriverHomePage.tsx`
- `DriverMarketplace.tsx`
- `DriverRedeemStorePage.tsx`
- Buscar resgatáveis de forma independente de Achadinhos
- Filtrar por:
  - `is_active = true`
  - `is_redeemable = true`
  - cidade (`branch_id = cidade ou null`)
  - público correto de resgate quando houver

5. Garantir o WhatsApp 100% subordinado à cidade
- `DriverPanelPage.tsx` continua como fonte única
- `HomeHeader`, `DriverMarketplace` e `DriverProgramInfo` continuam recebendo apenas o `whatsappNumber` já filtrado
- Com a leitura unificada das flags, se `enable_whatsapp_access = false`, o ícone some de verdade

Resultado esperado
- WhatsApp desligado na cidade:
  - some da Home
  - some do Marketplace
  - some dos links/CTAs relacionados

- Achadinhos OFF + Compre com Pontos ON:
  - busca/categorias/vitrine afiliada somem
  - produtos resgatáveis continuam aparecendo
  - “Ver todos” e loja de resgate continuam funcionando

- Achadinhos ON + Compre com Pontos ON:
  - os dois blocos coexistem normalmente

Validação após implementar
1. Testar a mesma cidade do print com WhatsApp OFF
2. Testar Achadinhos OFF + Compre com Pontos ON
3. Confirmar que existem produtos resgatáveis aparecendo mesmo sem `visible_driver`
4. Validar no celular a Home, o Marketplace e a Loja de Resgate
5. Atualizar a memória do projeto para registrar:
- flags de cidade com regra única
- resgate do motorista independente de Achadinhos e de `visible_driver`</final-text>