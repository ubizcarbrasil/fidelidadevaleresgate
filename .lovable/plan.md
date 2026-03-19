
## Plano atualizado: corrigir o vínculo da conta do lojista com a loja que tem resgates

### Diagnóstico confirmado
Revisei o código e o backend:

- A tela já está pronta para mostrar:
  - nome do cliente
  - telefone
  - oferta resgatada
  - validade da oferta
- As políticas de acesso que liberam os resgates para o lojista **já existem**
- O problema atual **não é mais a tela nem o RLS**

### Causa raiz real
Hoje existe um desencontro de vínculo:

1. A loja que tem resgate pendente está vinculada a **outro usuário proprietário**
2. Os usuários com papel `store_admin` encontrados no banco **não estão ligados a nenhuma loja aprovada**
3. O painel do parceiro busca a loja por `stores.owner_user_id = auth.uid()`

Resultado: a conta usada no teste entra no painel, mas **não é a dona da loja que possui os resgates**, então nada aparece.

Além disso:
- o cliente do resgate testado está com **telefone vazio** no cadastro
- algumas ofertas podem estar com **validade (`end_at`) nula**, então esse campo também pode não aparecer em todos os casos

## O que implementar
### 1. Corrigir o vínculo da loja com a conta usada no teste
Fazer ajuste de dados, não de schema:

- vincular a loja correta ao usuário parceiro correto em `stores.owner_user_id`
- garantir que essa mesma conta tenha o papel `store_admin`

Isso alinha:
- busca da loja no painel
- regra de acesso dos resgates
- exibição da lista correta

### 2. Validar os dados do cliente e da oferta
Para os registros que devem aparecer:

- preencher `customers.phone` quando o telefone existir
- revisar `offers.end_at` nas ofertas onde a validade deve ser mostrada

Sem esses dados, a UI continuará correta, mas alguns campos ficarão vazios.

### 3. Endurecer a UX para evitar novo falso “sumiu”
Depois do ajuste principal, melhorar a tela para não parecer erro silencioso:

- se o usuário `store_admin` não tiver loja vinculada, mostrar aviso claro:
  - “Sua conta não está vinculada a uma loja aprovada”
- se o cliente não tiver telefone, mostrar:
  - “Telefone não informado”
- se a oferta não tiver validade, mostrar:
  - “Sem validade definida”

## Arquivos envolvidos
### Ajuste de dados
- tabela `public.stores`
- tabela `public.user_roles`
- possivelmente `public.customers`
- possivelmente `public.offers`

### Ajuste opcional de interface
- `src/pages/StoreOwnerPanel.tsx`
- `src/components/store-owner/RedemptionHistoryList.tsx`

## Resultado esperado
Depois desse ajuste, o parceiro verá na aba de resgates a relação correta dos clientes que resgataram ofertas da sua loja, com:

- nome
- telefone
- oferta resgatada
- validade da oferta

## Detalhes técnicos
A lógica atual depende de duas condições ao mesmo tempo:

```text
conta logada
   -> precisa ser owner_user_id da loja
   -> e essa loja precisa ser a mesma onde existem offers/redemptions
```

Hoje essas duas pontas não estão alinhadas no banco.

O próximo passo correto não é outra policy, e sim **corrigir o vínculo entre usuário parceiro e loja**; depois disso, só complementar os dados faltantes (telefone/validade) e, se quiser, melhorar a mensagem da tela vazia.
