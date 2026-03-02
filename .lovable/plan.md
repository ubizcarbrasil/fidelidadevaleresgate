
## Plano: Jornada Completa do Catálogo Digital para Conferência

### Problema Atual
- Existem lojas EMISSORA com itens de catálogo, mas **nenhuma tem WhatsApp configurado** (checkout não funciona)
- **Nenhuma categoria** foi criada (`store_catalog_categories` vazio) — os chips de navegação não aparecem
- Cada loja tem apenas **1 item** — o grid fica vazio visualmente
- A **Jornada do Empreendedor** (`BrandJourneyGuidePage`) não menciona o Catálogo Digital

### O Que Será Feito

**1. Migration de dados de teste** (seed)
- Escolher uma loja EMISSORA (ex: "Churrascaria Brasa Viva") e configurar `whatsapp` e `points_per_real = 2`
- Criar 3-4 categorias para essa loja: "Carnes", "Acompanhamentos", "Bebidas", "Sobremesas"
- Inserir ~8-10 itens de catálogo com categorias, preços e imagens variadas
- Garantir que o fluxo completo é testável: categorias → grid → carrinho → WhatsApp

**2. Adicionar fase do Catálogo na Jornada do Empreendedor**
- Inserir nova fase (ex: Fase 5.5 entre Páginas Personalizadas e Parceiros) no `BrandJourneyGuidePage`
- Título: "Ativar o Catálogo Digital"
- Passos: ativar emissor, configurar pontos, criar categorias, adicionar produtos, testar checkout WhatsApp
- Dicas: destacar a regra de 1pt mínimo, o checkout via WhatsApp e o destaque de pontos

### Arquivos Modificados
- **Nova migration SQL**: seed de whatsapp, categorias e itens para a loja de teste
- **`src/pages/BrandJourneyGuidePage.tsx`**: adicionar fase do Catálogo Digital no array `journeySteps`
