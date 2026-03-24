
## Corrigir preços do Mirror Sync usando a página real do marketplace como fonte prioritária

### O problema encontrado
A correção de parsing já está aplicada e funcionando. O erro restante é de **fonte de dados**:

- a função `mirror-sync` hoje lê preços da API JSON  
  `https://api.divulgadorinteligente.com/api/products?...`
- mas você quer que o valor venha da vitrine real  
  `https://www.divulgadorinteligente.com/ubizresgata/promocoes-do-dia`
- o item destacado no print (`x4DDFLlhUE`) está salvo como **R$ 9,48** e a página do Divulgador também retorna **R$ 9,48**, então o sistema está obedecendo a fonte errada/capturada errada, não mais errando vírgula/ponto.

### O que vou mudar
1. **Trocar a prioridade da origem do preço no `mirror-sync`**
   - primeiro tentar capturar preço da página pública real do produto/vitrine
   - usar a API JSON apenas como fallback para campos auxiliares

2. **Aproveitar a configuração já existente de páginas extras**
   - hoje a UI do Mirror Sync já fala em `/promocoes-do-dia`, `/lojas/shopee`, etc.
   - vou alinhar a função para realmente usar essas páginas como fonte de descoberta/validação de preço

3. **Criar lógica de reconciliação de preço**
   - comparar:
     - preço da API
     - preço da página pública do produto
     - preço original/riscado quando existir
   - priorizar o valor encontrado no HTML da página real
   - só manter o da API quando a página não trouxer preço confiável

4. **Melhorar o diagnóstico no admin**
   - exibir no debug do Mirror Sync:
     - preço vindo da API
     - preço vindo da página
     - preço salvo no banco
     - fonte escolhida
   - isso evita “preço aparentemente errado” sem transparência

5. **Reprocessar nas próximas sincronizações**
   - como o sync já faz update, após a correção os preços dos deals serão normalizados sem criar duplicatas

### Arquivos a alterar
- `supabase/functions/mirror-sync/index.ts`
- possivelmente `supabase/functions/_shared/fetchRideData.ts` apenas se houver utilitário reaproveitável de fetch/parser
- `src/components/mirror-sync/MirrorSyncDebug.tsx`
- opcionalmente `src/components/mirror-sync/MirrorSyncLogs.tsx` para mostrar origem do preço no resumo/log

### Abordagem técnica
- manter `cleanPrice`, mas adicionar extração robusta de preço direto do HTML/markdown da página
- buscar primeiro:
  - página do produto `/p/:uuid`
  - se necessário, fallback em `/promocoes-do-dia`
- reconhecer padrões como:
  - `R$ 199,99 R$ 134,89`
  - preço único promocional
  - preço original + preço atual
- salvar metadados de diagnóstico em `details` do log, sem mudar schema do banco neste primeiro passo

### Resultado esperado
- o valor mostrado no admin e no app passará a refletir o **preço real exibido no marketplace público**
- produtos com preço promocional e preço riscado terão maior consistência
- ficará claro no painel de debug de onde o valor foi tirado

### Observação importante
Pelo que inspecionei, o config de Mirror Sync no banco para essa brand não está salvo no momento, embora a UI já tenha defaults. Então além de corrigir a função, vou alinhar a implementação para não depender de configuração ausente para usar `/promocoes-do-dia`.

### Validação após implementar
- rodar sync manual
- conferir o item do print e mais alguns itens de Shopee, Magalu e Mercado Livre
- verificar no admin se:
  - preço atual
  - preço original
  - fonte do preço
  estão coerentes com a página pública

### Detalhes técnicos
```text
Prioridade proposta:
1. preço da página pública do produto
2. preço encontrado na vitrine /promocoes-do-dia ou página da loja
3. preço da API JSON
```

```text
Diagnóstico por item:
- uuid
- título
- price_api
- price_page
- original_price_page
- price_persisted
- source_used
```
