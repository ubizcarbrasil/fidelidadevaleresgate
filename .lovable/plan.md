

# Cadastrar domínio customizado para a marca

## Problema
O domínio `valeresgata.ubizcar.com.br` não está cadastrado na tabela `brand_domains`. A marca "Ubiz Car" tem apenas o domínio `ubiz-car.valeresgate.com` registrado.

## Solução

### Passo 1 — Inserir o domínio customizado via migração SQL
Adicionar um registro na tabela `brand_domains` associando `valeresgata.ubizcar.com.br` à brand `44df8653-2a7a-40d1-b717-c6b09a6f694f` (Ubiz Car):

```sql
INSERT INTO brand_domains (brand_id, domain, subdomain, is_active)
VALUES ('44df8653-2a7a-40d1-b717-c6b09a6f694f', 'valeresgata.ubizcar.com.br', 'valeresgata', true);
```

### Passo 2 — Verificar DNS
O domínio `valeresgata.ubizcar.com.br` precisa apontar (via CNAME ou A record) para o servidor onde a aplicação está hospedada. Isso é configuração externa ao código.

## Impacto
- Nenhuma mudança de código — apenas um registro no banco
- Após inserir, o `resolveBrandByDomain` encontrará a marca pelo full domain match
- A página carregará o layout white-label da marca Ubiz Car

