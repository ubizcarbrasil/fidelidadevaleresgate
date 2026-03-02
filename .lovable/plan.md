

## Plano: Cadastrar módulos base na tabela `module_definitions`

Inserir registros iniciais na tabela `module_definitions` com os módulos fundamentais da plataforma, organizados por categoria.

### Dados a inserir

| key | name | category | is_core | description |
|-----|------|----------|---------|-------------|
| stores | Parceiros | core | true | Gestão de parceiros (lojas/estabelecimentos) |
| branches | Cidades | core | true | Gestão de cidades e regiões de operação |
| customers | Clientes | core | true | Cadastro e gestão de clientes |
| offers | Ofertas | comercial | false | Criação e gestão de ofertas e cupons |
| vouchers | Vouchers | comercial | false | Vouchers de desconto com regras avançadas |
| points | Pontos | fidelidade | false | Programa de pontos e cashback |
| points_rules | Regras de Pontos | fidelidade | false | Configuração de regras de acúmulo de pontos |
| catalog | Catálogo | comercial | false | Catálogo de produtos dos parceiros |
| affiliate_deals | Achadinhos | comercial | false | Ofertas de afiliados com links externos |
| banners | Banners | visual | false | Central de banners e comunicação visual |
| custom_pages | Páginas Custom | visual | false | Criação de páginas personalizadas |
| notifications | Notificações | engajamento | false | Envio de notificações para clientes |

### Execução

Usar o insert tool para executar um `INSERT INTO module_definitions` com todos os registros acima. Módulos "core" (stores, branches, customers) não poderão ser desativados por marca.

### Resultado

A página `/modules` (Definições de Módulos) exibirá os 12 módulos organizados por categoria, prontos para serem ativados/desativados por marca na página "Módulos da Marca".

