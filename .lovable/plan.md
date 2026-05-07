## Problema

Ao abrir `/ofertas` no domínio de preview (lovable.app) ou em qualquer domínio que não seja `app.valeresgate.com.br` e sem `?brandId=` na URL, a página exibe **"Parâmetro brandId é obrigatório"** e não carrega.

A resolução atual do hook `useMarcaOfertas` só considera duas fontes:
1. `?brandId=` na URL
2. Hostname exato `app.valeresgate.com.br` (hardcoded)

Não considera: subdomínios reais (ex.: `marca.valeresgate.com.br`), `brand_domains` (domínios customizados publicados), nem o `BrandContext` já resolvido pelo app.

## Solução

Alinhar a resolução da marca em `/ofertas` com o padrão do projeto (`BrandContext`), na ordem oficial:

1. **`?brandId=` na URL** (impersonation / preview com brand explícito)
2. **`BrandContext`** já resolvido pelo app (cobre domínios publicados, portal universal logado, e o preview do Lovable quando o usuário está num contexto de marca)
3. **Resolução por hostname** via `brand_domains` (subdomínio + domínio completo, mesma lógica de `resolveBrandByDomain` do `BrandContext.tsx`)
4. Fallback hostname `app.valeresgate.com.br` → portal Ubiz Resgata (mantém comportamento atual)

Se nenhuma das fontes resolver, exibir uma mensagem amigável (e não o erro técnico) com orientação: "Acesse pelo domínio da sua marca ou use o link compartilhado".

## Arquivos a alterar

- **`src/features/ubiz_ofertas/hooks/hook_marca_ofertas.ts`**
  - Importar e ler `useBrand()` do `BrandContext`.
  - Se `brand` já existir no contexto e não houver `?brandId=` divergente, usá-lo direto sem nova query.
  - Caso contrário, tentar resolução por hostname via `brand_domains` (extrair helper compartilhado ou replicar a lógica enxuta de `BrandContext.tsx` linhas 56–101).
  - Mensagem de erro: trocar `"Parâmetro brandId é obrigatório"` por `"Não foi possível identificar a marca para esta vitrine."`.

- **`src/features/ubiz_ofertas/services/servico_ofertas_publicas.ts`** (se necessário)
  - Adicionar `buscarBrandIdPorHostname(hostname)` consultando `brand_domains` (subdomain + domínio completo, `is_active = true`), espelhando `resolveBrandByDomain`.

- **`src/App.tsx`** (verificação)
  - Confirmar que `/ofertas` continua dentro do `BrandProvider` para que `useBrand()` funcione (já deve estar; só validar).

## Observações

- Não altera RLS nem schema. As queries de `brand_domains` já são acessíveis para anônimos no padrão atual (usadas pelo `BrandContext` antes do login).
- Mantém o toggle `enable_ubiz_ofertas_mode` como gate final — resolver a marca não implica liberar a vitrine.
- Não muda o comportamento do `?brandId=` (continua sendo prioridade máxima para impersonation).
