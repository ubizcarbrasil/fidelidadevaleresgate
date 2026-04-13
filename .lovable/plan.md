

## Correção: App do motorista vazio — "Nenhuma oferta disponível"

### Causa raiz

O problema é de **permissão no banco de dados (RLS)**, não de módulos da cidade.

A tabela `affiliate_deals` tem apenas duas políticas RLS:
1. **Admin** — permite tudo para root_admin e brand_admin
2. **Customers can view redeemable deals** — apenas para `authenticated` e somente `is_redeemable = true`

O app do motorista usa login por CPF (não autenticação do banco), então acessa como **anônimo**. Nenhuma política permite leitura anônima → resultado: **zero ofertas**.

A tabela `affiliate_deal_categories` já tem uma política pública (`Anyone can read active categories`), mas `affiliate_deals` não tem equivalente.

### Dados confirmados

- Existem **310 ofertas ativas** com `visible_driver = true` para Ubiz Resgata
- **63** são resgatáveis, **247** não são
- Todas com `branch_id = NULL` (visíveis para todas as cidades)
- As cidades Araxá e Leme estão com módulos habilitados corretamente

### Correção

**Migração SQL** — Criar política RLS pública para leitura de ofertas ativas:

```sql
CREATE POLICY "Public can view active driver deals"
ON public.affiliate_deals
FOR SELECT
TO public
USING (is_active = true AND visible_driver = true);
```

Isso permite que o app do motorista (acesso anônimo) veja as ofertas marcadas como visíveis para motoristas, sem expor ofertas inativas ou não-driver.

### Resultado esperado

| Antes | Depois |
|-------|--------|
| "Nenhuma oferta disponível" | 310 ofertas visíveis no marketplace do motorista |
| Categorias carregam, deals não | Tudo funciona normalmente |

### Arquivo alterado

Nenhum arquivo de código precisa ser alterado — apenas uma migração de banco de dados.

