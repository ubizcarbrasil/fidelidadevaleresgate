

## Corrigir acesso anônimo à view `public_brand_modules_safe`

### Problema
A view `public_brand_modules_safe` existe no banco e retorna dados corretamente, mas as permissões GRANT para os roles `anon` e `authenticated` **não foram aplicadas**. A consulta de permissões retorna vazio. Por isso, o PostgREST retorna 404 quando o painel do motorista (acesso anônimo) tenta consultar a view.

### Causa raiz
O GRANT estava na mesma migração que criou a view, mas aparentemente não foi executado com sucesso ou foi revertido.

### Solução
Criar uma nova migração SQL dedicada apenas ao GRANT:

```sql
GRANT SELECT ON public.public_brand_modules_safe TO anon, authenticated;
```

### Arquivos alterados
| Arquivo | Mudança |
|---------|---------|
| Nova migração SQL | GRANT SELECT para anon e authenticated |

Nenhum arquivo de código precisa mudar — o `DriverPanelPage.tsx` já usa a view corretamente.

### Resultado
O painel do motorista conseguirá consultar se o módulo `driver_hub` está ativo, e a Home do Motorista aparecerá quando habilitada.

