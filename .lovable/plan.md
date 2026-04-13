

## Plano: Corrigir resolução de brand no portal `app.valeresgate.com.br`

### Causa raiz (compartilhada pelos 2 bugs)

O `BrandContext` só verifica o parâmetro `?brandId=` da URL quando o hostname é "local" (lovable.app, localhost). No domínio `app.valeresgate.com.br`, ele resolve a brand pelo hostname → **sempre Ubiz Resgata**, ignorando o `?brandId=` na URL.

Resultado: quando o root admin acessa `app.valeresgate.com.br/?brandId=<meu-mototaxi-id>`, o `currentBrandId` do `useBrandGuard` retorna o ID da Ubiz Resgata, pois `brand` no contexto é Ubiz Resgata. Isso faz com que Links Úteis e Acessos de Teste mostrem dados da brand errada.

### Correção

**Arquivo:** `src/contexts/BrandContext.tsx` (linhas 122-142)

Alterar a lógica de resolução: no domínio `app.valeresgate.com.br` (portal), se houver `?brandId=` na URL, **priorizar o brandId da URL** sobre a resolução por domínio. Isso permite que o root admin impersone qualquer brand no portal.

```text
ANTES:
  if (isLocal) → verifica ?brandId=
  else         → resolve por domínio (ignora ?brandId=)

DEPOIS:
  1. Verificar ?brandId= na URL (qualquer domínio)
  2. Se encontrou, carregar brand por ID e retornar
  3. Se não, se isLocal → sem brand
  4. Se não, resolve por domínio
```

Isso é suficiente para corrigir ambos os bugs:
- **Bug 1 (Links Úteis):** O `DashboardQuickLinks` já busca domínio pela `currentBrandId` — com o ID correto, os links serão montados com `meu-mototaxi.valeresgate.com.br`
- **Bug 2 (Acessos de Teste):** O `DashboardQuickLinks` já busca `brand_settings_json` pela `currentBrandId` — com o ID correto, mostrará as contas do Meu Mototáxi

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/contexts/BrandContext.tsx` | Priorizar `?brandId=` sobre resolução por domínio em qualquer hostname |

### O que NÃO muda
- `DashboardQuickLinks.tsx` — já tem a lógica correta, só precisa do `currentBrandId` certo
- `DemoAccessCard.tsx` — idem
- Nenhuma migração SQL necessária
- Nenhuma alteração no fluxo de clientes/motoristas (eles não usam `?brandId=`)

