

# Plano: Disponibilizar campo WhatsApp no painel do empreendedor

## Contexto
Atualmente, o campo "WhatsApp (Achadinhos)" só existe no `BrandThemeEditor`, acessível pelo Root Admin nas rotas `/brands/:id` e `/platform-theme`. O empreendedor (Brand Admin) não tem acesso a esse campo.

## Investigação necessária
Preciso identificar qual tela/componente o painel do empreendedor usa para configurações de tema/identidade visual da marca, para adicionar o campo lá.

## Alterações previstas

### 1. Localizar a tela de configurações do empreendedor
- Identificar o componente de configurações de marca no console do Brand Admin
- Verificar se já existe um `BrandThemeEditor` ou equivalente nesse painel

### 2. Adicionar o campo WhatsApp
- Se o painel do empreendedor já usa `BrandThemeEditor`: garantir que a seção "Integrações" (`theme_integrations`) esteja habilitada via módulos para o Brand Admin
- Se usa outro componente: adicionar o campo de WhatsApp com a mesma lógica (leitura/gravação em `brand_settings_json.whatsapp_number`)

### 3. Controle de permissão
- Garantir que o módulo `theme_integrations` esteja visível para o empreendedor conforme a governança de módulos (customer_facing)

