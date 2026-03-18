

## Diagnóstico

Os contatos do CRM (`crm_contacts`) só aparecem na página de Clientes **após clicar no botão "Sincronizar CRM"**. Esse botão faz um "Pull" que importa contatos órfãos (`customer_id IS NULL`) do `crm_contacts` para a tabela `customers`. Sem clicar, eles ficam invisíveis.

## Plano: Sincronização automática ao carregar a página

Em vez de exigir clique manual, disparar a sincronização Pull automaticamente quando a página de Clientes carrega e existem contatos órfãos no CRM.

### Alteração

**Arquivo:** `src/pages/CustomersPage.tsx`

1. **Adicionar query de contagem de órfãos** — Um `useQuery` leve que conta quantos `crm_contacts` com `customer_id IS NULL` existem para a marca atual.

2. **Auto-sync via `useEffect`** — Quando a contagem de órfãos > 0, disparar automaticamente o `syncToCrmMutation` (a mesma lógica do botão CRM), com um flag para evitar re-execução em loop.

3. **Feedback visual** — Mostrar um toast discreto informando quantos contatos foram importados automaticamente do CRM.

### Fluxo resultante

```text
Página Clientes carrega
  └─ Query: SELECT count(*) FROM crm_contacts WHERE customer_id IS NULL AND brand_id = X
       ├─ 0 órfãos → nada acontece
       └─ N órfãos → auto-sync
            └─ Importa N contatos para customers
            └─ Toast: "N contatos importados do CRM"
            └─ Lista atualiza automaticamente
```

Nenhuma migração necessária. Alteração apenas no frontend.

