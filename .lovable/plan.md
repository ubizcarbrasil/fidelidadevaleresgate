
## Plano atualizado: corrigir o erro real da RPC de resgates e alinhar o que a tela deve mostrar

### Diagnóstico confirmado
Agora o problema está claro no runtime:

1. A chamada da aba Resgates está chegando ao backend
2. A RPC `rpc_get_store_owner_redemptions` está falhando com **HTTP 400**
3. Erro retornado:
```text
Returned type redemption_status does not match expected type text in column 3.
structure of query does not match function result type
```

Ou seja: a tela não está “sem dados” — ela está mostrando erro porque a função SQL foi criada com retorno `status text`, mas o `SELECT` devolve `r.status` como enum `redemption_status`.

### Causa raiz real
Existem dois pontos diferentes:

#### 1) Erro técnico que quebra a listagem
Na função SQL:
```sql
RETURNS TABLE (... status text, ...)
```

Mas no `RETURN QUERY`:
```sql
SELECT r.status, ...
```

Como `r.status` é enum e não `text`, a função quebra antes de retornar qualquer linha.

#### 2) O dado atual da loja não é pendente
Na loja “Mc donalds”, o registro encontrado hoje está com status:
```text
EXPIRED
```

Então, mesmo depois de corrigir a RPC, a seção “Aguardando Baixa” continuará vazia se a tela continuar mostrando apenas `PENDING` e `USED`.

## O que implementar

### 1. Corrigir a RPC no backend
Ajustar a função `rpc_get_store_owner_redemptions` para que os tipos retornados batam exatamente com a assinatura.

Mudança principal:
```sql
r.status::text
```

E revisar todos os campos sensíveis a tipo para evitar novo erro semelhante.

Exemplo esperado:
```sql
SELECT
  r.id,
  r.token,
  r.status::text,
  ...
```

### 2. Decidir como tratar `EXPIRED` na aba
Hoje a RPC filtra:
```sql
r.status IN ('PENDING', 'USED')
```

Mas o dado real da loja está `EXPIRED`. Então há duas opções de produto:

#### Opção A — manter como está
- “Aguardando Baixa” mostra só `PENDING`
- “Baixas Recentes” mostra só `USED`
- Resultado: a lista pode continuar vazia porque não existe resgate utilizável no momento

#### Opção B — mostrar expirados também
- incluir `EXPIRED` na RPC
- criar uma seção “Expirados” ou mostrar cartão desabilitado
- isso explica ao lojista por que não há baixa possível

Pelo estado atual dos dados, essa opção deixa a experiência mais clara.

### 3. Ajustar a UI para refletir erro vs. ausência real
Depois da correção da RPC:

- se houver erro: manter o card vermelho com mensagem real
- se não houver linhas:
  - mostrar estado vazio correto
  - não parecer bug
- se houver `EXPIRED`:
  - mostrar explicitamente como expirado, não como “sumiu”

### 4. Não editar arquivos auto-gerados manualmente
Na implementação, não devo editar manualmente:
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`

A correção deve ficar na migration SQL e, se necessário, no componente da tela.

## Arquivos envolvidos
- `supabase/migrations/...sql` — corrigir a função `rpc_get_store_owner_redemptions`
- `src/components/store-owner/StoreRedeemTab.tsx` — manter consumo da RPC
- `src/components/store-owner/RedemptionHistoryList.tsx` — opcionalmente adicionar seção/estado para expirados

## Resultado esperado
Após a correção:

1. o erro vermelho deixará de aparecer
2. a aba Resgates vai carregar normalmente
3. o comportamento ficará coerente com os dados reais:
   - se houver pendente, aparece em “Aguardando Baixa”
   - se houver usado, aparece em “Baixas Recentes”
   - se houver apenas expirado, isso pode ser exibido claramente em vez de parecer falha

## Detalhes técnicos
```text
Problema atual:
frontend -> rpc_get_store_owner_redemptions
         -> Postgres retorna 400
         -> mismatch: redemption_status != text
         -> UI mostra erro

Depois da correção:
frontend -> rpc_get_store_owner_redemptions
         -> status convertido com cast explícito
         -> resposta válida
         -> UI mostra linhas reais
```

### Resumo objetivo
O problema principal agora não é mais vínculo, nem RLS, nem join no cliente.

O erro real é:
```text
a RPC foi criada com tipo de retorno incompatível com o SELECT
```

E, além disso, o registro atual da loja está `EXPIRED`, não `PENDING`.

Então a próxima implementação correta é:
1. corrigir os casts da função SQL
2. decidir se a aba deve exibir expirados também
3. manter a UI distinguindo erro técnico de lista vazia real
