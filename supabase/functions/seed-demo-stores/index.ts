import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DemoOffer {
  coupon_type: "PRODUCT" | "STORE";
  discount_percent: number;
  /** For PRODUCT: the product price in R$ */
  product_price?: number;
  /** For STORE: minimum purchase in R$ */
  min_purchase?: number;
  /** Product/offer name (used in title generation) */
  label: string;
  image_url: string;
  description: string;
}

interface DemoStore {
  name: string;
  slug: string;
  segment: string;
  description: string;
  store_type: "RECEPTORA" | "EMISSORA" | "MISTA";
  color: string;
  offers: DemoOffer[];
  catalog?: { name: string; price: number; description: string; image_url: string; category: string }[];
}

function logo(name: string, bg: string): string {
  const encoded = encodeURIComponent(name.substring(0, 2).toUpperCase());
  return `https://ui-avatars.com/api/?name=${encoded}&background=${bg}&color=fff&size=256&rounded=true&bold=true`;
}

/** Build title + value_rescue from offer data */
function buildOffer(o: DemoOffer) {
  if (o.coupon_type === "PRODUCT") {
    const price = o.product_price || 0;
    const valueRescue = Math.floor(o.discount_percent / 100 * price);
    const credit = valueRescue.toFixed(2).replace(".", ",");
    const title = `Pague ${o.discount_percent}% com Pontos — ${o.label}`;
    return { title, value_rescue: valueRescue, min_purchase: 0, product_price: price };
  } else {
    const min = o.min_purchase || 0;
    const valueRescue = Math.floor(o.discount_percent / 100 * min);
    const credit = valueRescue.toFixed(2).replace(".", ",");
    const title = `Troque ${valueRescue} pts por R$ ${credit} em crédito`;
    return { title, value_rescue: valueRescue, min_purchase: min, product_price: 0 };
  }
}

const DEMO_STORES: DemoStore[] = [
  { name: "Pizzaria Bella Napoli", slug: "pizzaria-bella-napoli", segment: "Pizzaria", description: "As melhores pizzas artesanais da cidade, massa feita diariamente.", store_type: "MISTA", color: "E53935",
    offers: [
      { coupon_type: "PRODUCT", discount_percent: 20, product_price: 39.90, label: "Pizza Grande", image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop", description: "Pizza grande de qualquer sabor tradicional" },
      { coupon_type: "STORE", discount_percent: 10, min_purchase: 60, label: "", image_url: "", description: "Desconto válido em todo o cardápio" },
    ],
    catalog: [
      { name: "Pizza Margherita", price: 45.90, description: "Molho de tomate, mozzarella, manjericão", image_url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop", category: "Pizzas" },
      { name: "Pizza Calabresa", price: 42.90, description: "Calabresa fatiada, cebola e azeitonas", image_url: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop", category: "Pizzas" },
      { name: "Refrigerante 2L", price: 12.00, description: "Coca-Cola, Guaraná ou Fanta", image_url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=300&fit=crop", category: "Bebidas" },
    ],
  },
  { name: "Burger House", slug: "burger-house", segment: "Hamburgueria", description: "Hambúrgueres artesanais com blend exclusivo de carnes nobres.", store_type: "MISTA", color: "FF6F00",
    offers: [
      { coupon_type: "PRODUCT", discount_percent: 15, product_price: 42.90, label: "Combo Burger + Fritas + Refri", image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop", description: "Combo completo com hambúrguer artesanal" },
      { coupon_type: "STORE", discount_percent: 15, min_purchase: 50, label: "", image_url: "", description: "Desconto em pedidos acima de R$50" },
    ],
    catalog: [
      { name: "Classic Burger", price: 32.90, description: "Pão brioche, blend 180g, queijo, salada", image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop", category: "Burgers" },
      { name: "Bacon Burger", price: 38.90, description: "Com bacon crocante e cheddar", image_url: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop", category: "Burgers" },
    ],
  },
  { name: "Barbearia Premium", slug: "barbearia-premium", segment: "Barbearia", description: "Cortes masculinos clássicos e modernos com atendimento VIP.", store_type: "RECEPTORA", color: "37474F",
    offers: [{ coupon_type: "PRODUCT", discount_percent: 25, product_price: 45, label: "Corte + Barba", image_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=300&fit=crop", description: "Combo corte masculino com barba" }],
  },
  { name: "Pet Love", slug: "pet-love", segment: "Pet Shop", description: "Tudo para seu pet: banho, tosa, rações premium e acessórios.", store_type: "MISTA", color: "66BB6A",
    offers: [
      { coupon_type: "PRODUCT", discount_percent: 20, product_price: 65, label: "Banho + Tosa", image_url: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop", description: "Banho e tosa para cães de todos os portes" },
      { coupon_type: "STORE", discount_percent: 5, min_purchase: 80, label: "", image_url: "", description: "Desconto em todas as rações do estoque" },
    ],
    catalog: [
      { name: "Ração Golden Special 15kg", price: 129.90, description: "Ração premium para cães adultos", image_url: "https://images.unsplash.com/photo-1589924749359-5c8888fc5783?w=400&h=300&fit=crop", category: "Rações" },
      { name: "Banho Completo Cães", price: 65.00, description: "Banho com hidratação para cães", image_url: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&h=300&fit=crop", category: "Serviços" },
    ],
  },
  { name: "Farmácia Saúde+", slug: "farmacia-saude-mais", segment: "Farmácia", description: "Medicamentos, perfumaria e produtos de saúde com os melhores preços.", store_type: "RECEPTORA", color: "1B5E20",
    offers: [{ coupon_type: "STORE", discount_percent: 10, min_purchase: 50, label: "", image_url: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400&h=300&fit=crop", description: "Desconto em toda linha de perfumaria" }],
  },
  { name: "Academia FitMax", slug: "academia-fitmax", segment: "Academia", description: "Musculação, funcional, spinning e muito mais para sua saúde.", store_type: "EMISSORA", color: "D32F2F",
    offers: [
      { coupon_type: "STORE", discount_percent: 100, min_purchase: 89.90, label: "", image_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop", description: "Experimente 1 semana totalmente grátis" },
      { coupon_type: "STORE", discount_percent: 15, min_purchase: 239.90, label: "", image_url: "", description: "Desconto no plano de 3 meses" },
    ],
    catalog: [
      { name: "Plano Mensal", price: 89.90, description: "Acesso ilimitado por 30 dias", image_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop", category: "Planos" },
      { name: "Plano Trimestral", price: 239.90, description: "3 meses com desconto", image_url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop", category: "Planos" },
    ],
  },
  { name: "Padaria Pão Quente", slug: "padaria-pao-quente", segment: "Padaria", description: "Pães frescos, bolos, salgados e cafés especiais toda manhã.", store_type: "RECEPTORA", color: "F9A825",
    offers: [{ coupon_type: "PRODUCT", discount_percent: 20, product_price: 7.90, label: "Café + Pão na Chapa", image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop", description: "Combo café da manhã especial" }],
  },
  { name: "Gelato Art", slug: "gelato-art", segment: "Sorveteria", description: "Sorvetes artesanais italianos com frutas frescas e ingredientes naturais.", store_type: "RECEPTORA", color: "E91E63",
    offers: [
      { coupon_type: "PRODUCT", discount_percent: 15, product_price: 12, label: "Casquinha Dupla", image_url: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&h=300&fit=crop", description: "Duas bolas na casquinha artesanal" },
      { coupon_type: "STORE", discount_percent: 10, min_purchase: 30, label: "", image_url: "", description: "Desconto no sorvete por quilo" },
    ],
  },
  { name: "Sushi Kaze", slug: "sushi-kaze", segment: "Restaurante Japonês", description: "Culinária japonesa autêntica com peixes frescos importados.", store_type: "MISTA", color: "B71C1C",
    offers: [{ coupon_type: "PRODUCT", discount_percent: 20, product_price: 69.90, label: "Combo 30 Peças", image_url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop", description: "Combinado especial com 30 peças variadas" }],
    catalog: [
      { name: "Combo Tradicional 20pcs", price: 54.90, description: "Sushis e sashimis variados", image_url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop", category: "Combos" },
      { name: "Temaki Salmão", price: 24.90, description: "Temaki de salmão com cream cheese", image_url: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&h=300&fit=crop", category: "Temakis" },
    ],
  },
  { name: "Café Aroma", slug: "cafe-aroma", segment: "Cafeteria", description: "Cafés especiais, cappuccinos artesanais e doces finos.", store_type: "RECEPTORA", color: "4E342E",
    offers: [{ coupon_type: "PRODUCT", discount_percent: 15, product_price: 16.90, label: "Cappuccino + Brownie", image_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop", description: "Combo perfeito para a tarde" }],
  },
  { name: "Moda Style", slug: "moda-style", segment: "Loja de Roupas", description: "Moda feminina e masculina com as últimas tendências.", store_type: "RECEPTORA", color: "8E24AA",
    offers: [
      { coupon_type: "STORE", discount_percent: 20, min_purchase: 150, label: "", image_url: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=300&fit=crop", description: "Desconto em toda coleção primavera/verão" },
      { coupon_type: "STORE", discount_percent: 33, min_purchase: 200, label: "", image_url: "", description: "Promoção especial em peças selecionadas" },
    ],
  },
  { name: "Ótica VisionPlus", slug: "otica-visionplus", segment: "Ótica", description: "Óculos de grau e sol das melhores marcas com exame gratuito.", store_type: "RECEPTORA", color: "1565C0",
    offers: [{ coupon_type: "STORE", discount_percent: 100, min_purchase: 100, label: "", image_url: "https://images.unsplash.com/photo-1574258495973-f7977603b6d2?w=400&h=300&fit=crop", description: "Exame completo grátis na compra de armação" }],
  },
  { name: "LavandeRia Express", slug: "lavanderia-express", segment: "Lavanderia", description: "Lavagem a seco, passadoria e entrega em domicílio.", store_type: "RECEPTORA", color: "0097A7",
    offers: [{ coupon_type: "STORE", discount_percent: 30, min_purchase: 80, label: "", image_url: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=400&h=300&fit=crop", description: "Desconto para novos clientes" }],
  },
  { name: "Auto Center Mestre", slug: "auto-center-mestre", segment: "Oficina Mecânica", description: "Revisão completa, troca de óleo, pneus e diagnóstico eletrônico.", store_type: "RECEPTORA", color: "546E7A",
    offers: [{ coupon_type: "PRODUCT", discount_percent: 25, product_price: 149, label: "Revisão + Troca de Óleo", image_url: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400&h=300&fit=crop", description: "Revisão completa com troca de óleo inclusa" }],
  },
  { name: "Flora & Jardim", slug: "flora-e-jardim", segment: "Floricultura", description: "Arranjos florais, plantas ornamentais e decoração para eventos.", store_type: "RECEPTORA", color: "43A047",
    offers: [{ coupon_type: "PRODUCT", discount_percent: 20, product_price: 49.90, label: "Buquê de Rosas", image_url: "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=400&h=300&fit=crop", description: "Buquê com 12 rosas vermelhas" }],
  },
  { name: "Livraria Palavra Viva", slug: "livraria-palavra-viva", segment: "Livraria", description: "Best-sellers, clássicos, HQs e papelaria fina.", store_type: "RECEPTORA", color: "6D4C41",
    offers: [{ coupon_type: "STORE", discount_percent: 33, min_purchase: 100, label: "", image_url: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=300&fit=crop", description: "Promoção especial em títulos selecionados" }],
  },
  { name: "Papelaria Criativa", slug: "papelaria-criativa", segment: "Papelaria", description: "Material escolar, escritório, artesanato e presentes criativos.", store_type: "RECEPTORA", color: "FF7043",
    offers: [{ coupon_type: "STORE", discount_percent: 15, min_purchase: 80, label: "", image_url: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&h=300&fit=crop", description: "Desconto no kit escolar completo" }],
  },
  { name: "Açaí da Terra", slug: "acai-da-terra", segment: "Açaíteria", description: "Açaí puro do Pará com frutas frescas e complementos premium.", store_type: "MISTA", color: "4A148C",
    offers: [{ coupon_type: "PRODUCT", discount_percent: 15, product_price: 21.90, label: "Açaí 500ml + Complemento", image_url: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&h=300&fit=crop", description: "Açaí cremoso com 1 complemento por conta da casa" }],
    catalog: [
      { name: "Açaí 300ml", price: 14.90, description: "Açaí puro com granola e banana", image_url: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&h=300&fit=crop", category: "Açaís" },
      { name: "Açaí 500ml", price: 21.90, description: "Açaí turbinado com frutas", image_url: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&h=300&fit=crop", category: "Açaís" },
    ],
  },
  { name: "Cervejaria Hop Lab", slug: "cervejaria-hop-lab", segment: "Cervejaria", description: "Cervejas artesanais de fabricação própria com estilos variados.", store_type: "EMISSORA", color: "E65100",
    offers: [{ coupon_type: "PRODUCT", discount_percent: 25, product_price: 14.90, label: "Pint Artesanal", image_url: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=300&fit=crop", description: "Qualquer estilo de cerveja artesanal" }],
    catalog: [
      { name: "IPA Tropical 600ml", price: 24.90, description: "Cerveja IPA com notas tropicais", image_url: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=300&fit=crop", category: "Cervejas" },
      { name: "Pilsen Premium 1L", price: 18.90, description: "Pilsen leve e refrescante", image_url: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=300&fit=crop", category: "Cervejas" },
    ],
  },
  { name: "Doce Mania", slug: "doce-mania", segment: "Doceria", description: "Brigadeiros gourmet, bolos decorados e doces finos para festas.", store_type: "RECEPTORA", color: "F06292",
    offers: [{ coupon_type: "PRODUCT", discount_percent: 20, product_price: 39.90, label: "Caixa 25 Brigadeiros", image_url: "https://images.unsplash.com/photo-1558326567-98ae2405596b?w=400&h=300&fit=crop", description: "Brigadeiros gourmet sortidos" }],
  },
  { name: "Clínica Belezza", slug: "clinica-belezza", segment: "Clínica Estética", description: "Procedimentos estéticos, limpeza de pele e harmonização facial.", store_type: "RECEPTORA", color: "AD1457",
    offers: [
      { coupon_type: "PRODUCT", discount_percent: 30, product_price: 89, label: "Limpeza de Pele", image_url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop", description: "Limpeza de pele profunda com hidratação" },
      { coupon_type: "STORE", discount_percent: 10, min_purchase: 500, label: "", image_url: "", description: "Desconto em procedimentos de harmonização" },
    ],
  },
  { name: "OdontoSmile", slug: "odontosmile", segment: "Dentista", description: "Clínica odontológica com clareamento, implantes e ortodontia.", store_type: "RECEPTORA", color: "00838F",
    offers: [{ coupon_type: "STORE", discount_percent: 100, min_purchase: 120, label: "", image_url: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=400&h=300&fit=crop", description: "Primeira consulta e limpeza sem custo" }],
  },
  { name: "Studio Hair", slug: "studio-hair", segment: "Salão de Beleza", description: "Cortes, coloração, hidratação e tratamentos capilares.", store_type: "RECEPTORA", color: "C62828",
    offers: [{ coupon_type: "PRODUCT", discount_percent: 20, product_price: 59, label: "Escova + Hidratação", image_url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop", description: "Escova modelada com hidratação profunda" }],
  },
  { name: "Mercadinho Bom Preço", slug: "mercadinho-bom-preco", segment: "Mercadinho", description: "Hortifruti frescos, carnes selecionadas e produtos do dia a dia.", store_type: "EMISSORA", color: "2E7D32",
    offers: [{ coupon_type: "STORE", discount_percent: 5, min_purchase: 100, label: "", image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop", description: "Desconto em compras acima de R$100" }],
    catalog: [{ name: "Cesta Básica Completa", price: 189.90, description: "30 itens essenciais do mês", image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop", category: "Cestas" }],
  },
  { name: "Pé de Ouro", slug: "pe-de-ouro", segment: "Loja de Calçados", description: "Calçados femininos, masculinos e infantis das melhores marcas.", store_type: "RECEPTORA", color: "5D4037",
    offers: [{ coupon_type: "STORE", discount_percent: 50, min_purchase: 150, label: "", image_url: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=300&fit=crop", description: "Compre um par e ganhe 50% no segundo" }],
  },
  { name: "Casa de Carnes Nobre", slug: "casa-de-carnes-nobre", segment: "Casa de Carnes", description: "Carnes premium, cortes especiais e embutidos artesanais.", store_type: "RECEPTORA", color: "BF360C",
    offers: [{ coupon_type: "PRODUCT", discount_percent: 15, product_price: 89.90, label: "Kit Churrasco", image_url: "https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400&h=300&fit=crop", description: "Kit completo para churrasco de 10 pessoas" }],
  },
  { name: "TechStore", slug: "techstore", segment: "Loja de Eletrônicos", description: "Smartphones, notebooks, acessórios e assistência técnica.", store_type: "RECEPTORA", color: "1A237E",
    offers: [{ coupon_type: "STORE", discount_percent: 10, min_purchase: 100, label: "", image_url: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=300&fit=crop", description: "Desconto em capas, fones e carregadores" }],
  },
  { name: "Trattoria Italiana", slug: "trattoria-italiana", segment: "Restaurante Italiano", description: "Massas frescas, risotos cremosos e vinhos italianos selecionados.", store_type: "MISTA", color: "C62828",
    offers: [{ coupon_type: "PRODUCT", discount_percent: 20, product_price: 59.90, label: "Massa + Vinho", image_url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop", description: "Qualquer massa com taça de vinho" }],
    catalog: [
      { name: "Fettuccine Alfredo", price: 42.90, description: "Massa fresca ao molho branco com parmesão", image_url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop", category: "Massas" },
      { name: "Risoto de Funghi", price: 48.90, description: "Risoto cremoso com mix de cogumelos", image_url: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop", category: "Risotos" },
    ],
  },
  { name: "Churrascaria Fogo Nobre", slug: "churrascaria-fogo-nobre", segment: "Churrascaria", description: "Rodízio completo de carnes nobres com buffet de saladas.", store_type: "RECEPTORA", color: "DD2C00",
    offers: [{ coupon_type: "PRODUCT", discount_percent: 15, product_price: 59.90, label: "Rodízio Completo", image_url: "https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=300&fit=crop", description: "Rodízio completo com sobremesa inclusa" }],
  },
  { name: "Brink Kids", slug: "brink-kids", segment: "Loja de Brinquedos", description: "Brinquedos educativos, jogos de tabuleiro e diversão garantida.", store_type: "RECEPTORA", color: "FF6F00",
    offers: [{ coupon_type: "STORE", discount_percent: 20, min_purchase: 100, label: "", image_url: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=300&fit=crop", description: "Desconto em jogos de tabuleiro e cartas" }],
  },
  { name: "Beleza Natural", slug: "beleza-natural", segment: "Loja de Cosméticos", description: "Maquiagem, skincare, perfumes e produtos de beleza importados.", store_type: "RECEPTORA", color: "880E4F",
    offers: [{ coupon_type: "PRODUCT", discount_percent: 25, product_price: 129.90, label: "Kit Skincare", image_url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop", description: "Kit limpeza + hidratante + protetor solar" }],
  },
  { name: "Ink Masters", slug: "ink-masters", segment: "Estúdio de Tatuagem", description: "Tatuagens artísticas, coberturas e piercings com profissionais premiados.", store_type: "RECEPTORA", color: "212121",
    offers: [{ coupon_type: "PRODUCT", discount_percent: 30, product_price: 150, label: "Flash Tattoo", image_url: "https://images.unsplash.com/photo-1590246814883-57764a8a0d4a?w=400&h=300&fit=crop", description: "Tatuagens de designs prontos do estúdio" }],
  },
  { name: "English Now", slug: "english-now", segment: "Escola de Idiomas", description: "Cursos de inglês, espanhol e francês para todas as idades.", store_type: "EMISSORA", color: "0D47A1",
    offers: [{ coupon_type: "STORE", discount_percent: 100, min_purchase: 50, label: "", image_url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop", description: "1 aula experimental sem compromisso" }],
    catalog: [
      { name: "Curso Regular Mensal", price: 299.90, description: "2x por semana, turmas reduzidas", image_url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop", category: "Cursos" },
      { name: "Intensivo 1 Mês", price: 499.90, description: "Aulas diárias por 1 mês", image_url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop", category: "Cursos" },
    ],
  },
  { name: "Power Suplementos", slug: "power-suplementos", segment: "Loja de Suplementos", description: "Whey protein, creatina, BCAA e suplementos das melhores marcas.", store_type: "RECEPTORA", color: "F57F17",
    offers: [{ coupon_type: "PRODUCT", discount_percent: 10, product_price: 149.90, label: "Whey Protein 1kg", image_url: "https://images.unsplash.com/photo-1593095948071-474c5cc2c4d8?w=400&h=300&fit=crop", description: "Whey Protein concentrado 1kg" }],
  },
  { name: "Adega Bacchus", slug: "adega-bacchus", segment: "Loja de Vinhos", description: "Vinhos nacionais e importados, espumantes e destilados premium.", store_type: "RECEPTORA", color: "4A148C",
    offers: [{ coupon_type: "PRODUCT", discount_percent: 25, product_price: 99.90, label: "Kit 2 Vinhos", image_url: "https://images.unsplash.com/photo-1474722883778-792e7990302f?w=400&h=300&fit=crop", description: "Seleção especial de vinhos tintos e brancos" }],
  },
  { name: "Verde Vegan", slug: "verde-vegan", segment: "Restaurante Vegano", description: "Culinária vegana criativa com ingredientes orgânicos e locais.", store_type: "MISTA", color: "33691E",
    offers: [{ coupon_type: "PRODUCT", discount_percent: 15, product_price: 24.90, label: "Prato Executivo Vegano", image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop", description: "Prato do dia com entrada e sobremesa" }],
    catalog: [
      { name: "Bowl Proteico", price: 32.90, description: "Grão de bico, quinoa, legumes grelhados", image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop", category: "Bowls" },
      { name: "Hambúrguer Vegano", price: 28.90, description: "Blend de grão de bico com especiarias", image_url: "https://images.unsplash.com/photo-1520072959219-c595e6cdc07a?w=400&h=300&fit=crop", category: "Lanches" },
    ],
  },
  { name: "Pastelão do Zé", slug: "pastelao-do-ze", segment: "Pastelaria", description: "Pastéis gigantes crocantes com recheios tradicionais e especiais.", store_type: "RECEPTORA", color: "E65100",
    offers: [{ coupon_type: "PRODUCT", discount_percent: 20, product_price: 12, label: "Pastel + Caldo de Cana", image_url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop", description: "Combo tradicional de feira" }],
  },
  { name: "Cell Fix", slug: "cell-fix", segment: "Loja de Celulares", description: "Assistência técnica, capas, películas e acessórios para celular.", store_type: "RECEPTORA", color: "263238",
    offers: [{ coupon_type: "PRODUCT", discount_percent: 15, product_price: 250, label: "Troca de Tela", image_url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop", description: "Reparo de tela para qualquer modelo" }],
  },
  { name: "Confeitaria Doce Sonho", slug: "confeitaria-doce-sonho", segment: "Confeitaria", description: "Bolos personalizados, tortas e doces finos para festas e eventos.", store_type: "RECEPTORA", color: "D81B60",
    offers: [{ coupon_type: "PRODUCT", discount_percent: 20, product_price: 129, label: "Bolo Festa 3kg", image_url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop", description: "Bolo decorado para até 30 pessoas" }],
  },
  { name: "Lanchonete Sabor", slug: "lanchonete-sabor", segment: "Lanchonete", description: "Lanches rápidos, porções generosas e pratos feitos caseiros.", store_type: "RECEPTORA", color: "F4511E",
    offers: [
      { coupon_type: "PRODUCT", discount_percent: 10, product_price: 18.90, label: "Prato Feito", image_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop", description: "Prato do dia com arroz, feijão, carne e salada" },
      { coupon_type: "STORE", discount_percent: 10, min_purchase: 30, label: "", image_url: "", description: "Desconto em pedidos para entrega" },
    ],
  },
  { name: "Bar do Chico", slug: "bar-do-chico", segment: "Bar", description: "Petiscos, cervejas geladas e drinks autorais em ambiente descontraído.", store_type: "RECEPTORA", color: "4E342E",
    offers: [
      { coupon_type: "PRODUCT", discount_percent: 50, product_price: 15, label: "Happy Hour Chope", image_url: "https://images.unsplash.com/photo-1575037614876-c38a4c44f5b8?w=400&h=300&fit=crop", description: "Chope artesanal em dobro das 17h às 20h" },
      { coupon_type: "STORE", discount_percent: 10, min_purchase: 80, label: "", image_url: "", description: "Desconto válido em toda a conta" },
    ],
  },
  { name: "Depil Center", slug: "depil-center", segment: "Depilação", description: "Depilação a laser, cera e linha para rosto e corpo.", store_type: "RECEPTORA", color: "E91E63",
    offers: [
      { coupon_type: "PRODUCT", discount_percent: 30, product_price: 200, label: "Depilação a Laser", image_url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop", description: "Sessão de depilação a laser em área à escolha" },
      { coupon_type: "STORE", discount_percent: 20, min_purchase: 500, label: "", image_url: "", description: "Pacote fechado com 20% de desconto" },
    ],
  },
  { name: "Make Art Studio", slug: "make-art-studio", segment: "Maquiagem", description: "Maquiagem profissional para eventos, noivas e produções especiais.", store_type: "RECEPTORA", color: "AD1457",
    offers: [
      { coupon_type: "PRODUCT", discount_percent: 25, product_price: 89, label: "Make Completa", image_url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop", description: "Maquiagem completa para qualquer ocasião" },
    ],
  },
  { name: "SuperMarket Economia", slug: "supermarket-economia", segment: "Supermercado", description: "Tudo para sua casa com os melhores preços e ofertas semanais.", store_type: "EMISSORA", color: "1B5E20",
    offers: [
      { coupon_type: "STORE", discount_percent: 5, min_purchase: 200, label: "", image_url: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=300&fit=crop", description: "Desconto para compras do mês" },
      { coupon_type: "STORE", discount_percent: 15, min_purchase: 50, label: "", image_url: "", description: "Desconto em frutas, verduras e legumes" },
    ],
    catalog: [
      { name: "Cesta Básica Premium", price: 249.90, description: "40 itens essenciais para o mês", image_url: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=300&fit=crop", category: "Cestas" },
    ],
  },
  { name: "Spa Zen Beleza", slug: "spa-zen-beleza", segment: "Beleza e Bem-Estar", description: "Massagens relaxantes, tratamentos faciais e terapias holísticas.", store_type: "RECEPTORA", color: "00695C",
    offers: [
      { coupon_type: "PRODUCT", discount_percent: 25, product_price: 149, label: "Day Spa Completo", image_url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop", description: "Pacote completo com massagem + facial + escalda-pés" },
      { coupon_type: "PRODUCT", discount_percent: 20, product_price: 79, label: "Massagem Relaxante 60min", image_url: "", description: "Sessão de 60 minutos de massagem relaxante" },
    ],
  },
  { name: "Loja Central", slug: "loja-central", segment: "Loja", description: "Variedades, utilidades domésticas, presentes e novidades para toda a família.", store_type: "RECEPTORA", color: "5D4037",
    offers: [
      { coupon_type: "STORE", discount_percent: 10, min_purchase: 50, label: "", image_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop", description: "Desconto válido em todos os produtos" },
    ],
  },
  { name: "Restaurante Sabor da Casa", slug: "restaurante-sabor-da-casa", segment: "Restaurante", description: "Comida caseira feita com carinho, buffet por quilo e pratos executivos.", store_type: "MISTA", color: "BF360C",
    offers: [
      { coupon_type: "PRODUCT", discount_percent: 15, product_price: 24.90, label: "Executivo Completo", image_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop", description: "Prato + sobremesa + suco natural" },
      { coupon_type: "STORE", discount_percent: 10, min_purchase: 40, label: "", image_url: "", description: "Desconto válido no almoço" },
    ],
    catalog: [
      { name: "Executivo Carne", price: 24.90, description: "Arroz, feijão, carne grelhada, salada e suco", image_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop", category: "Executivos" },
      { name: "Executivo Frango", price: 22.90, description: "Arroz, feijão, frango grelhado, salada e suco", image_url: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=300&fit=crop", category: "Executivos" },
    ],
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Allow service-role or authenticated user calls (function is idempotent)
    const authHeader = req.headers.get("Authorization") || "";
    let callerUserId = "00000000-0000-0000-0000-000000000000";

    if (authHeader.startsWith("Bearer ")) {
      const anonClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: claimsData } = await anonClient.auth.getClaims(
        authHeader.replace("Bearer ", ""),
      );
      if (claimsData?.claims?.sub) {
        callerUserId = claimsData.claims.sub as string;
      }
    }

    const body = await req.json();
    const { brand_id, branch_id } = body;

    if (!brand_id || !branch_id) {
      return new Response(JSON.stringify({ error: "brand_id and branch_id are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify brand and branch exist
    const { data: brand } = await supabaseAdmin.from("brands").select("id, slug").eq("id", brand_id).single();
    if (!brand) {
      return new Response(JSON.stringify({ error: "Brand not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: branch } = await supabaseAdmin.from("branches").select("id").eq("id", branch_id).single();
    if (!branch) {
      return new Response(JSON.stringify({ error: "Branch not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const suffix = brand.slug.replace(/[^a-z0-9]/g, "");
    let created = 0;
    let skipped = 0;

    for (const demo of DEMO_STORES) {
      const storeSlug = `${demo.slug}-${suffix}`;
      const logoUrl = logo(demo.name, demo.color);

      // Skip if already exists
      const { data: existing } = await supabaseAdmin
        .from("stores").select("id").eq("brand_id", brand_id).eq("slug", storeSlug).maybeSingle();
      if (existing) { skipped++; continue; }

      const { data: newStore, error: storeErr } = await supabaseAdmin
        .from("stores").insert({
          name: demo.name, slug: storeSlug, brand_id, branch_id,
          logo_url: logoUrl, segment: demo.segment, description: demo.description,
          store_type: demo.store_type, approval_status: "APPROVED", is_active: true,
          approved_at: new Date().toISOString(), email: `${demo.slug}@demo.com`,
        }).select("id").single();

      if (storeErr) { console.error(`Store ${demo.name}: ${storeErr.message}`); continue; }

      // Create offers with correct value_rescue calculations
      for (const offer of demo.offers) {
        const built = buildOffer(offer);
        await supabaseAdmin.from("offers").insert({
          title: built.title, description: offer.description,
          coupon_type: offer.coupon_type, discount_percent: offer.discount_percent,
          value_rescue: built.value_rescue,
          min_purchase: offer.coupon_type === "STORE" ? built.min_purchase : 0,
          image_url: offer.image_url || logoUrl,
          store_id: newStore.id, brand_id, branch_id,
          status: "ACTIVE", is_active: true, allowed_weekdays: [0, 1, 2, 3, 4, 5, 6],
          terms_params_json: offer.coupon_type === "PRODUCT"
            ? { product_price: built.product_price, discount_percent: offer.discount_percent }
            : { min_purchase: built.min_purchase, discount_percent: offer.discount_percent },
        });
      }

      // Create catalog items
      if (demo.catalog?.length && (demo.store_type === "EMISSORA" || demo.store_type === "MISTA")) {
        for (let ci = 0; ci < demo.catalog.length; ci++) {
          const item = demo.catalog[ci];
          await supabaseAdmin.from("store_catalog_items").insert({
            name: item.name, price: item.price, description: item.description,
            image_url: item.image_url, category: item.category,
            store_id: newStore.id, brand_id, branch_id,
            is_active: true, order_index: ci,
          });
        }
      }

      created++;
    }

    // Credit 1000 points to all test customers of this brand
    let creditedCustomers = 0;
    const { data: customers } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("brand_id", brand_id)
      .eq("branch_id", branch_id);

    if (customers?.length) {
      for (const cust of customers) {
        // Check if already credited (avoid duplicates)
        const { data: existing } = await supabaseAdmin
          .from("points_ledger")
          .select("id")
          .eq("customer_id", cust.id)
          .eq("reason", "DEMO_SEED_BONUS")
          .maybeSingle();

        if (!existing) {
          await supabaseAdmin.from("points_ledger").insert({
            brand_id,
            branch_id,
            customer_id: cust.id,
            entry_type: "CREDIT",
            points_amount: 1000,
            money_amount: 0,
            reason: "DEMO_SEED_BONUS",
            reference_type: "MANUAL_ADJUSTMENT",
            created_by_user_id: callerUserId,
          });

          // Update cached balance
          await supabaseAdmin
            .from("customers")
            .update({ points_balance: 1000 })
            .eq("id", cust.id);

          creditedCustomers++;
        }
      }
    }
    const { data: allMods } = await supabaseAdmin
      .from("module_definitions").select("id").eq("is_active", true);
    if (allMods?.length) {
      const { data: existingMods } = await supabaseAdmin
        .from("brand_modules").select("module_definition_id").eq("brand_id", brand_id);
      const existingIds = new Set((existingMods || []).map((m: any) => m.module_definition_id));
      const newMods = allMods.filter((m: any) => !existingIds.has(m.id));
      if (newMods.length > 0) {
        await supabaseAdmin.from("brand_modules").insert(
          newMods.map((m: any, i: number) => ({
            brand_id, module_definition_id: m.id, is_enabled: true, order_index: i,
          })),
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, created, skipped, total: DEMO_STORES.length, creditedCustomers }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("seed-demo-stores error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
