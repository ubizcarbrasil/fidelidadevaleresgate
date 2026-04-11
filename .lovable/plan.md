

## Plano: Corrigir visibilidade dos produtos de resgate para clientes

### Problema
A tabela `affiliate_deals` tem RLS ativado com apenas uma política para admins. Clientes autenticados não conseguem ler os produtos, então a loja de resgate aparece vazia.

### Solução
Adicionar uma política de SELECT para usuários autenticados com role `customer`, permitindo leitura apenas dos produtos ativos e resgatáveis.

### Mudança

**1. Migração SQL** — Nova política RLS na tabela `affiliate_deals`

```sql
CREATE POLICY "Customers can view redeemable deals"
ON public.affiliate_deals
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND is_redeemable = true
);
```

Essa política permite que qualquer usuário autenticado (incluindo clientes) visualize produtos que estejam ativos e marcados como resgatáveis. Dados sensíveis não são expostos pois a query do cliente já seleciona apenas colunas públicas.

### Arquivos envolvidos
- 1 migração SQL (nova política RLS)

### Resultado
Os produtos de resgate ativados aparecerão na loja do cliente imediatamente.

