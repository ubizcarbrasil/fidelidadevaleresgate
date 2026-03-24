

## Mover deal "Brinox - Potes" de "Ofertas Variadas" para "Casa"

### Dados identificados

| Item | Valor |
|------|-------|
| Deal ID | `497ebfca-acd3-44a3-b4e1-0c9615145a02` |
| Título | Brinox - Conjunto de Potes para Mantimentos com Tampa 5 Peças Suprema - Aço Inox |
| Categoria atual | Ofertas Variadas (`3ce7c883-5e4a-4cf3-904e-ec1049df9cbe`) |
| Categoria correta | Casa (`6f2031a9-7ca3-4bbd-af3e-7869cabe5fe3`) |

### Correção

Uma única operação de UPDATE na tabela `affiliate_deals`:

```sql
UPDATE affiliate_deals 
SET category_id = '6f2031a9-7ca3-4bbd-af3e-7869cabe5fe3'
WHERE id = '497ebfca-acd3-44a3-b4e1-0c9615145a02';
```

Isso será executado via migration (única forma disponível para escrita no banco). Nenhuma alteração de código é necessária — apenas a correção do dado.

### Resultado esperado

O deal "Brinox - Conjunto de Potes" aparecerá na categoria "Casa" tanto no painel admin quanto na vitrine do consumidor.

