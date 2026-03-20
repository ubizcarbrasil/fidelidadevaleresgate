

## Plano: Restringir módulos do empreendedor apenas ao que afeta o app do cliente

### Problema
Hoje o empreendedor (Brand Admin) vê **todos** os módulos alocados à sua marca na página "Funcionalidades da Marca" e pode ativar/desativar qualquer um — incluindo módulos que controlam o **próprio painel administrativo** dele (auditoria, permissões, tema, integrações, etc.).

Isso é uma violação de governança: o empreendedor estaria dando e tirando permissões de si mesmo, quando quem define o que ele pode acessar é exclusivamente o ROOT via plano.

O empreendedor só deveria controlar o que o **cliente final** vê no app.

### Solução

**1. Adicionar campo `customer_facing` na tabela `module_definitions`**

Novo campo booleano que marca se o módulo afeta a experiência do cliente ou se é recurso administrativo:

- `customer_facing = true` → o empreendedor pode ativar/desativar (controla o que o cliente vê)
- `customer_facing = false` → só o ROOT controla (recurso do painel admin)

Classificação proposta:

| Módulo | customer_facing |
|---|---|
| Ofertas, Lojas, Clientes, Carteira, Home Sections, Resgate QR | ✅ (core do app) |
| Catálogo, Vouchers, Cupons, Achadinhos, Patrocinados | ✅ (comercial) |
| Pontos, Regras de Pontos, Pontuar Cliente, Multi-Emissor, Ganha-Ganha | ✅ (fidelidade) |
| Notificações, Tour de Boas-Vindas, Missões | ✅ (engajamento cliente) |
| Cidades | ✅ |
| CRM, Guias, Relatórios, Taxonomia | ❌ (ferramenta admin) |
| Auditoria, Permissões, Aprovações, Hub de Acesso | ❌ (governança admin) |
| Tema, Tipografia, Imagens, Layout, Cards de Oferta | ❌ (visual admin) |
| Page Builder, Ícones, Landing Page, Links Perfil, App Icons | ❌ (visual admin) |
| Integrações, API Keys, Machine Integration | ❌ (admin) |
| Configurações, Importação CSV, Domínios, Assinatura | ❌ (admin) |

**2. Migração SQL**
- Adicionar coluna `customer_facing boolean NOT NULL DEFAULT false` em `module_definitions`
- UPDATE em massa classificando cada módulo

**3. Atualizar `BrandModulesPage.tsx`**
- Para o empreendedor (não ROOT): filtrar `visibleDefinitions` para mostrar apenas `customer_facing = true`
- ROOT continua vendo tudo
- Mudar o texto descritivo para: "Escolha quais funcionalidades seus clientes terão acesso no aplicativo"

### Arquivos envolvidos
- Nova migração SQL — adicionar e popular `customer_facing`
- `src/pages/BrandModulesPage.tsx` — filtrar por `customer_facing` quando não for ROOT

### Resultado
O empreendedor verá apenas módulos que afetam o app do cliente e poderá ativar/desativar somente esses. Módulos administrativos (governança, tema, integrações) ficam sob controle exclusivo do ROOT.

