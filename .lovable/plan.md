
Diagnóstico confirmado:

- O problema não parece ser falta de produto nem falta de módulo.
- A marca `db15bd21-9137-4965-a0fb-540d8e8b26f1` está com:
  - `customer_product_redeem` ativo
  - `customer_redeem_mirror_driver = true`
- Existem produtos resgatáveis ativos no banco:
  - `50` com `redeemable_by = both`
  - `12` com `redeemable_by = driver`
- Ou seja: catálogo para passageiro existe.

Causa mais provável:

- A tela do passageiro ainda consulta a tabela base `affiliate_deals` diretamente em `src/components/customer/CustomerRedeemStorePage.tsx`.
- Depois das mudanças de segurança, essa leitura pode falhar para navegação pública/sem sessão válida.
- Como o componente hoje não trata `dealsRes.error` nem `catsRes.error`, a falha vira lista vazia silenciosa — parece “não apareceu”, mesmo com dados existentes.

Plano de correção:

1. Ajustar a fonte de dados da loja do passageiro
- Trocar a leitura da tela do passageiro para usar a view pública segura em vez da tabela base.
- Isso evita depender da política da tabela interna para exibir catálogo.

2. Atualizar a view pública de produtos
- Criar migração para incluir na view pública os campos necessários para a loja do passageiro, principalmente:
  - `redeemable_by`
  - `category_id`
  - `is_redeemable`
  - `redeem_points_cost`
- Manter a view segura e pública, sem expor campos internos desnecessários.

3. Corrigir a lógica da loja do passageiro
- Em `src/components/customer/CustomerRedeemStorePage.tsx`:
  - consultar a view pública
  - manter o filtro por branch
  - manter a regra:
    - se espelhamento estiver ligado, mostrar catálogo resgatável
    - se desligado, mostrar apenas `customer` e `both`

4. Parar de esconder erro como “lista vazia”
- Tratar `error` das queries de produtos e categorias.
- Mostrar estado de erro real ao usuário/admin em vez de simplesmente renderizar “Nenhum produto encontrado”.

5. Revisão dos pontos correlatos
- Verificar se outros componentes customer-facing ainda estão lendo `affiliate_deals` diretamente e alinhar ao mesmo padrão seguro quando necessário, para evitar regressão semelhante.

Arquivos envolvidos:

- `src/components/customer/CustomerRedeemStorePage.tsx`
- 1 nova migração SQL para atualizar a view pública de produtos
- possivelmente:
  - `src/components/customer/AchadinhoSection.tsx`
  - `src/components/customer/AchadinhoDealsOverlay.tsx`

Detalhe técnico importante:

- Hoje a policy criada resolve leitura autenticada de produtos resgatáveis, mas não resolve bem o caso em que o app do passageiro navega sem sessão válida.
- Como já existe uma estratégia de “view pública segura” no projeto, o ajuste mais consistente é usar essa mesma abordagem para a loja de resgate do passageiro, em vez de abrir mais a tabela base.

Resultado esperado após a implementação:

- Os produtos resgatáveis voltarão a aparecer para o passageiro.
- O comportamento ficará consistente mesmo no fluxo público.
- Se houver falha futura de acesso, a tela passará a mostrar erro real em vez de parecer vazia.
