

## Auto-vinculação de motorista ao login no PWA

### Problema
Quando o webhook cria um motorista automaticamente, o registro `customers` fica **sem `user_id`**. Quando esse motorista faz login no PWA, o `CustomerContext` não encontra nenhum customer com seu `user_id` e cria um registro novo — perdendo o saldo de pontos e histórico.

### Solução
No `CustomerContext.tsx`, antes de criar um novo customer, buscar registros `[MOTORISTA]` sem `user_id` que correspondam por **email**, **telefone** ou **CPF**. Se encontrar, vincular o `user_id` e retornar esse registro.

### Fluxo

```text
Login no PWA
  ↓
CustomerContext.queryFn
  ↓
1. Busca customer com user_id (fluxo atual) → encontrou? retorna
  ↓
2. [NOVO] Busca customer sem user_id, com tag [MOTORISTA], 
   matching por email OU phone OU cpf
  ↓
   Encontrou? → UPDATE user_id = auth.uid → retorna registro vinculado
  ↓
3. Auto-create (fluxo atual, para clientes normais)
```

### Implementação

#### Arquivo: `src/contexts/CustomerContext.tsx`

Após a busca por `user_id` retornar vazio (linha ~57), adicionar bloco de auto-vinculação:

```typescript
// Tentar vincular motorista órfão por email/phone/cpf
const userEmail = user!.email;
const userPhone = user!.user_metadata?.phone || null;

// Buscar motoristas sem user_id nesta brand
let orphanQuery = supabase
  .from("customers")
  .select("*")
  .eq("brand_id", brand!.id)
  .is("user_id", null)
  .ilike("name", "%[MOTORISTA]%");

// Construir filtro OR por email/phone
const orFilters: string[] = [];
if (userEmail) orFilters.push(`email.eq.${userEmail}`);
if (userPhone) orFilters.push(`phone.eq.${userPhone}`);

if (orFilters.length > 0) {
  const { data: orphans } = await orphanQuery.or(orFilters.join(","));
  const match = orphans?.[0];
  if (match) {
    const { data: linked } = await supabase
      .from("customers")
      .update({ user_id: user!.id, branch_id: selectedBranch!.id })
      .eq("id", match.id)
      .select("*")
      .maybeSingle();
    return linked || match;
  }
}
```

Nenhuma migration necessária — usa apenas colunas existentes (`email`, `phone`, `user_id`, `name`).

### Arquivo afetado

| Arquivo | Ação |
|---------|------|
| `src/contexts/CustomerContext.tsx` | Adicionar busca por motorista órfão antes do auto-create |

