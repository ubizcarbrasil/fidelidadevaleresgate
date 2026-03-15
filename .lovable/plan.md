

## Plano: Redesign do Perfil do Parceiro

### Situação Atual
O `StoreProfileTab` usa campos de URL manual para logo, banner e galeria. Falta: nome, e-mail, telefone, alterar senha, tags de produto dinâmicas, e edição/adição de ofertas e filiais. O componente `ImageUploadField` já existe com upload + crop para o bucket `brand-assets`. A coluna `tags: string[]` já existe na tabela `stores`.

### Alterações

#### 1. `StoreProfileTab.tsx` — Reestruturar completamente

Reorganizar o perfil em seções lógicas:

**a) Seção "Dados do Estabelecimento"**
- Nome da loja (`store.name`) — campo editável
- E-mail (`store.email`) — campo editável
- Telefone (`store.phone`) — campo editável
- Descrição — textarea (já existe)

**b) Seção "Logomarca"**
- Substituir campo URL por `ImageUploadField` com `folder="stores/{store.id}/logo"`, `aspectRatio={1}`
- Preview circular

**c) Seção "Banner"**
- Substituir campo URL por `ImageUploadField` com `folder="stores/{store.id}/banner"`, `aspectRatio={16/9}`

**d) Seção "Galeria de Fotos"**
- Substituir campos URL manuais por múltiplos `ImageUploadField` uploads
- Botão "Adicionar foto" que abre o upload, até 10 imagens
- Grid de preview com botão remover

**e) Seção "Segmento e Tags de Produtos"**
- Manter `SegmentAutocomplete` para segmento
- Novo: após selecionar o segmento, carregar os `taxonomy_segments` da mesma `category_id` e exibir como chips selecionáveis para marcar quais tipos de produto a loja vende (salva no campo `tags: string[]` da stores)

**f) Seção "Alterar Senha"**
- Integrar `ChangePasswordDialog` inline no perfil

**g) Seção "Links e Contato"**
- Manter site, Instagram, WhatsApp, endereço (já existe)

**h) Mover para fora do perfil:**
- Regras de Pontuação, FAQ, Horário de Funcionamento, Vídeo — permanecem no perfil mas agrupados abaixo

#### 2. Seção "Tags Dinâmicas de Produto"
- Quando o parceiro seleciona um segmento (ex: "Hamburgueria", category "Alimentação"), buscar todos os outros segmentos da mesma `taxonomy_categories` e exibir como badges clicáveis
- Ex: Segmento = Hamburgueria (cat: Alimentação) → Tags disponíveis: "Pizza", "Sushi", "Açaí", "Lanches", etc.
- Tags selecionadas salvam em `stores.tags[]`
- Sem migração necessária — campo `tags` já existe

#### 3. Ações rápidas no menu lateral do StoreOwnerPanel
- Já existe "Meu Perfil" no menu
- Já existe acesso a cupons (editar oferta) via tab "Cupons"
- Já existe "Cidades" (filiais) no menu

### Arquivos afetados
1. `src/components/store-owner/StoreProfileTab.tsx` — rewrite completo com uploads, tags dinâmicas, dados pessoais, alterar senha
2. Nenhuma migração necessária (campos `name`, `email`, `phone`, `tags`, `logo_url`, `banner_url`, `gallery_urls` já existem)

