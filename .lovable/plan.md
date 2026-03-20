
Plano atualizado: fazer a aba Resgates buscar os dados por um endpoint do backend e exibir erro real quando a consulta falhar

Diagnóstico confirmado
- A conta está correta: a loja “Mc donalds” está vinculada ao mesmo usuário lojista do teste.
- Já existe resgate pendente no banco para essa loja.
- A oferta existe e tem validade cadastrada.
- A tela já foi alterada para mostrar nome, telefone e validade.
- O print mostra um sinal importante: lista vazia + botão “Carregar mais”. Pelo código atual, isso acontece quando a consulta inicial falha e a UI não mostra o erro.

O que isso significa
- O problema agora não parece ser mais vínculo da loja nem ausência de resgate.
- O problema mais provável é a forma atual de buscar os dados:
  1. busca ofertas da loja
  2. depois busca redemptions com joins em offers/customers/branches
- Se qualquer parte dessa consulta composta falhar, a tela fica parecendo “sem dados”, mesmo com resgate existente.

Observação importante sobre os dados atuais
- O telefone do cliente do resgate testado está nulo no banco.
- Então, mesmo corrigindo a listagem, esse caso deve aparecer como “Telefone não informado”.
- A validade da oferta deve aparecer, porque ela existe.

Implementação proposta
1. Trocar a busca da aba Resgates por uma função RPC dedicada no backend
- Criar uma função que receba `store_id`, `page` e `page_size`
- A função deve:
  - validar que a loja pertence ao usuário autenticado
  - retornar somente os campos necessários para a tela
  - fazer os joins internamente com `redemptions`, `offers`, `customers` e `branches`

2. Atualizar `StoreRedeemTab.tsx`
- Remover a lógica em duas etapas (`offers` -> `redemptions`)
- Passar a consumir apenas a RPC paginada
- Ajustar `hasMore` para começar como `false` e só ligar após resposta válida
- Tratar erro da query e erro do “Carregar mais”

3. Melhorar a UX da tela
- Se a consulta falhar, mostrar card de erro com mensagem clara e botão “Tentar novamente”
- Não exibir estado vazio silencioso quando houver erro
- Não mostrar “Carregar mais” antes da primeira carga bem-sucedida

4. Manter os fallbacks visuais já existentes
- Telefone ausente: “Telefone não informado”
- Validade ausente: “Sem validade definida”

Arquivos envolvidos
- `src/components/store-owner/StoreRedeemTab.tsx`
- `src/components/store-owner/RedemptionHistoryList.tsx`
- nova função SQL no backend via migration

Resultado esperado
- O lojista verá os resgates reais da sua loja
- Cada item mostrará:
  - nome do cliente
  - telefone (ou fallback)
  - oferta resgatada
  - validade da oferta
- Se houver qualquer erro de acesso/consulta, a tela deixará isso explícito em vez de parecer “vazia”

Detalhes técnicos
```text
Problema atual:
frontend -> offers
         -> redemptions + joins
         -> falha silenciosa -> tela vazia

Novo fluxo:
frontend -> rpc_get_store_owner_redemptions(store_id, page, page_size)
         -> backend valida owner_user_id = auth.uid()
         -> backend retorna linhas prontas para a UI
```

Resumo do porquê essa é a correção certa
- Já existe resgate real para a loja do teste
- O vínculo do lojista com a loja está correto
- O código visual já foi alterado
- O comportamento exibido na tela aponta para falha de consulta escondida pela UI
- Centralizar a leitura numa RPC segura elimina a fragilidade dos joins no cliente e resolve o “não pareceu nada”
