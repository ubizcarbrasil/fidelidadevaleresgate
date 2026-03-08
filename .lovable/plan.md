

# Plano: Simulador Realista com 40 Parceiros Demo

## Resumo

Expandir a edge function `provision-brand` para criar automaticamente 40 parceiros fictícios de diversos segmentos, cada um com logomarca real, ofertas de produto, ofertas de loja toda, parceiros emissores, e dados de catálogo. Todos os módulos serão ativados (não apenas os `is_core`).

## O que muda para o usuário

Ao criar uma nova empresa pelo Wizard, o app do cliente virá **pré-populado** com 40 estabelecimentos realistas de segmentos variados (pizzaria, pet shop, barbearia, farmácia, academia, padaria, etc.), cada um com:
- Logo e imagem de produto reais (via URLs públicas de imagens gratuitas como `ui-avatars.com` para logos e `picsum.photos`/`unsplash` para produtos)
- 1-3 ofertas ativas (mix de ofertas de produto e loja toda)
- Tipos variados: RECEPTORA, EMISSORA e MISTA
- Itens de catálogo digital para parceiros emissores
- Todos os módulos ativados para experimentação completa

## Mudanças Técnicas

### 1. Edge Function `provision-brand/index.ts` (reescrever)

**Seção de dados demo** - Adicionar um array hardcoded com ~40 parceiros fictícios contendo:
- `name`, `slug`, `segment`, `description`, `store_type` (RECEPTORA/EMISSORA/MISTA)
- `logo_url` (usando `https://ui-avatars.com/api/?name=NOME&background=COR&color=fff&size=256&rounded=true` para gerar logos automaticamente com iniciais coloridas)
- `image_url` para ofertas (usando URLs do `https://images.unsplash.com` com IDs fixos para cada segmento)

**Lógica de criação em lote:**
- Loop pelos 40 parceiros: `INSERT` em `stores` com `approval_status: APPROVED`, `is_active: true`
- Para cada parceiro, criar 1-3 ofertas em `offers` com `status: ACTIVE`, variando entre `coupon_type: PRODUCT` e `coupon_type: STORE`
- Para parceiros do tipo EMISSORA/MISTA, criar 2-3 itens em `store_catalog_items`
- Valores de desconto variados (5%, 10%, 15%, 20%, R$5, R$10)

**Ativação de todos os módulos:**
- Alterar o passo 8 para buscar **todos** os `module_definitions` ativos (remover filtro `is_core = true`), garantindo que tudo fique ativado

**Segmentos incluídos** (exemplos):
Pizzaria, Hamburgueria, Barbearia, Pet Shop, Farmácia, Academia, Padaria, Sorveteria, Restaurante Japonês, Cafeteria, Loja de Roupas, Ótica, Lavanderia, Oficina Mecânica, Floricultura, Livraria, Papelaria, Açaíteria, Cervejaria, Doceria, Clínica Estética, Dentista, Salão de Beleza, Mercadinho, Loja de Calçados, Casa de Carnes, Loja de Eletrônicos, Restaurante Italiano, Churrascaria, Loja de Brinquedos, Loja de Cosméticos, Estúdio de Tatuagem, Escola de Idiomas, Loja de Suplementos, Loja de Vinhos, Restaurante Vegano, Pastelaria, Loja de Celulares, Confeitaria, Lanchonete

### 2. Seções de vitrine automáticas

Além do template padrão, criar seções de vitrine (`brand_sections`) para categorias como "Gastronomia", "Saúde & Beleza", "Serviços" para que o app já tenha navegação por segmentos.

### 3. Nenhuma alteração no banco de dados

Todas as tabelas necessárias (`stores`, `offers`, `store_catalog_items`, `brand_modules`, `brand_sections`) já existem. Apenas a edge function precisa ser atualizada.

## Escopo

- **1 arquivo modificado**: `supabase/functions/provision-brand/index.ts`
- **Impacto**: Apenas novas empresas provisionadas após a mudança terão os 40 parceiros. Empresas existentes não são afetadas.

