

## Plano: Corrigir classificação dos módulos visíveis ao empreendedor

### Problema
A migração anterior marcou módulos administrativos como `customer_facing = true` — por exemplo: "Lojas", "Cidades", "Clientes", "Regras de Pontos", "Pontuar Cliente". Esses são ferramentas de gestão do painel, não funcionalidades que o cliente vê no app. O empreendedor continua vendo permissões que dizem respeito ao próprio painel, não ao app do cliente.

### O que corrigir

**1. Reclassificar módulos no banco**

Módulos que devem deixar de ser `customer_facing`:

| Módulo | Motivo |
|---|---|
| `stores` | Gestão de parceiros (admin) |
| `branches` | Gestão de cidades (admin) |
| `customers` | Gestão de clientes (admin) |
| `points_rules` | Configuração de regras (admin) |
| `earn_points_store` | Operação do lojista (admin) |

Módulos que permanecem `customer_facing = true` (aparecem no app do cliente):

- Ofertas, Carteira, Home Sections, Resgate QR (core — sempre ligados)
- Catálogo, Vouchers, Achadinhos, Patrocinados (comercial)
- Pontos, Ganha-Ganha (fidelidade do cliente)
- Notificações, Tour de Boas-Vindas (engajamento)
- Banners, Páginas Custom (visual do app)

**2. Esconder módulos core (não-toggleáveis) da vista do empreendedor**

Módulos `is_core = true` estão sempre ligados e o Switch fica desabilitado. Mostrá-los é confuso — o empreendedor não pode alterá-los. Remover da lista para non-ROOT.

**3. Ajustar filtro no frontend**

Em `BrandModulesPage.tsx`, para non-ROOT:
- Filtrar `customer_facing = true` (já faz)
- Adicionar: excluir `is_core = true` (novo)

### Arquivos envolvidos
- Nova migração SQL — `UPDATE module_definitions SET customer_facing = false WHERE key IN (...)`
- `src/pages/BrandModulesPage.tsx` — ajustar filtro para esconder core

### Resultado
O empreendedor verá apenas funcionalidades que afetam diretamente o que o cliente vê no app: ofertas, catálogo, pontos, vouchers, notificações, banners, etc. Nenhum módulo administrativo aparecerá.

