

## Plano: Corrigir cor dos botões no painel admin

### Problema
Os botões "Abrir" na seção "Links Úteis" do Dashboard estão exibindo um azul antigo. Isso acontece porque o `BrandContext` aplica `useBrandTheme(brand.brand_settings_json)` que sobrescreve a variável CSS `--primary` com a cor configurada da marca — que ainda está com o azul antigo.

Existem dois cenários possíveis:

**A)** A cor primária da marca no banco de dados não foi atualizada (ainda está no azul antigo). Nesse caso, basta atualizar o `brand_settings_json` da marca via o editor de tema.

**B)** O painel admin deveria sempre usar a cor da plataforma (Cyan `187 85% 43%`), independente da cor da marca. Nesse caso, precisamos ajustar a ordem de prioridade dos temas.

### Solução proposta (Cenário B — mais provável)

**`src/components/AppLayout.tsx`**
- Mover a chamada `useBrandTheme(platformTheme)` para que seja aplicada **depois** do `BrandContext`, ou adicionar prioridade ao tema da plataforma no admin.

Alternativamente, no `BrandContext.tsx`, não aplicar o brand theme quando o contexto é admin (não é customer-facing):

**`src/contexts/BrandContext.tsx`**
- Condicionar a chamada `useBrandTheme(brand?.brand_settings_json)` para que só aplique no contexto do app do cliente (`/customer-preview`, `/c/`), não no painel admin.

Isso fará com que o painel admin sempre use as cores da plataforma (Cyan), enquanto o app do cliente continua usando as cores configuradas da marca.

### Arquivos alterados
1. `src/contexts/BrandContext.tsx` — condicionar aplicação do tema da marca apenas no app do cliente

