import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Demo Stores Data ────────────────────────────────────────────────
interface DemoStore {
  name: string;
  slug: string;
  segment: string;
  description: string;
  store_type: "RECEPTORA" | "EMISSORA" | "MISTA";
  color: string;
  offers: DemoOffer[];
  catalog?: DemoCatalogItem[];
}
interface DemoOffer {
  title: string;
  coupon_type: "PRODUCT" | "STORE";
  discount_percent: number;
  value_rescue: number;
  image_url: string;
  description: string;
}
interface DemoCatalogItem {
  name: string;
  price: number;
  description: string;
  image_url: string;
  category: string;
}

function logo(name: string, bg: string): string {
  const encoded = encodeURIComponent(name.substring(0, 2).toUpperCase());
  return `https://ui-avatars.com/api/?name=${encoded}&background=${bg}&color=fff&size=256&rounded=true&bold=true`;
}

const DEMO_STORES: DemoStore[] = [
  {
    name: "Pizzaria Bella Napoli", slug: "pizzaria-bella-napoli", segment: "Pizzaria",
    description: "As melhores pizzas artesanais da cidade, massa feita diariamente.", store_type: "MISTA", color: "E53935",
    offers: [
      { title: "Pizza Grande por R$39,90", coupon_type: "PRODUCT", discount_percent: 20, value_rescue: 50, image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop", description: "Pizza grande de qualquer sabor tradicional" },
      { title: "10% OFF na loja toda", coupon_type: "STORE", discount_percent: 10, value_rescue: 30, image_url: "", description: "Desconto válido em todo o cardápio" },
    ],
    catalog: [
      { name: "Pizza Margherita", price: 45.90, description: "Molho de tomate, mozzarella, manjericão", image_url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop", category: "Pizzas" },
      { name: "Pizza Calabresa", price: 42.90, description: "Calabresa fatiada, cebola e azeitonas", image_url: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop", category: "Pizzas" },
      { name: "Refrigerante 2L", price: 12.00, description: "Coca-Cola, Guaraná ou Fanta", image_url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=300&fit=crop", category: "Bebidas" },
    ],
  },
  {
    name: "Burger House", slug: "burger-house", segment: "Hamburgueria",
    description: "Hambúrgueres artesanais com blend exclusivo de carnes nobres.", store_type: "MISTA", color: "FF6F00",
    offers: [
      { title: "Combo Burger + Fritas + Refri", coupon_type: "PRODUCT", discount_percent: 15, value_rescue: 40, image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop", description: "Combo completo com hambúrguer artesanal" },
      { title: "15% OFF pedido acima de R$50", coupon_type: "STORE", discount_percent: 15, value_rescue: 50, image_url: "", description: "Desconto em pedidos acima de R$50" },
    ],
    catalog: [
      { name: "Classic Burger", price: 32.90, description: "Pão brioche, blend 180g, queijo, salada", image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop", category: "Burgers" },
      { name: "Bacon Burger", price: 38.90, description: "Com bacon crocante e cheddar", image_url: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop", category: "Burgers" },
    ],
  },
  {
    name: "Barbearia Premium", slug: "barbearia-premium", segment: "Barbearia",
    description: "Cortes masculinos clássicos e modernos com atendimento VIP.", store_type: "RECEPTORA", color: "37474F",
    offers: [
      { title: "Corte + Barba por R$45", coupon_type: "PRODUCT", discount_percent: 25, value_rescue: 45, image_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=300&fit=crop", description: "Combo corte masculino com barba" },
    ],
  },
  {
    name: "Pet Love", slug: "pet-love", segment: "Pet Shop",
    description: "Tudo para seu pet: banho, tosa, rações premium e acessórios.", store_type: "MISTA", color: "66BB6A",
    offers: [
      { title: "Banho + Tosa com 20% OFF", coupon_type: "PRODUCT", discount_percent: 20, value_rescue: 60, image_url: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop", description: "Banho e tosa para cães de todos os portes" },
      { title: "5% OFF em rações", coupon_type: "STORE", discount_percent: 5, value_rescue: 20, image_url: "", description: "Desconto em todas as rações do estoque" },
    ],
    catalog: [
      { name: "Ração Golden Special 15kg", price: 129.90, description: "Ração premium para cães adultos", image_url: "https://images.unsplash.com/photo-1589924749359-5c8888fc5783?w=400&h=300&fit=crop", category: "Rações" },
      { name: "Banho Completo Cães", price: 65.00, description: "Banho com hidratação para cães", image_url: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&h=300&fit=crop", category: "Serviços" },
    ],
  },
  {
    name: "Farmácia Saúde+", slug: "farmacia-saude-mais", segment: "Farmácia",
    description: "Medicamentos, perfumaria e produtos de saúde com os melhores preços.", store_type: "RECEPTORA", color: "1B5E20",
    offers: [
      { title: "10% OFF em perfumaria", coupon_type: "STORE", discount_percent: 10, value_rescue: 25, image_url: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400&h=300&fit=crop", description: "Desconto em toda linha de perfumaria" },
    ],
  },
  {
    name: "Academia FitMax", slug: "academia-fitmax", segment: "Academia",
    description: "Musculação, funcional, spinning e muito mais para sua saúde.", store_type: "EMISSORA", color: "D32F2F",
    offers: [
      { title: "1 semana grátis", coupon_type: "STORE", discount_percent: 100, value_rescue: 80, image_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop", description: "Experimente 1 semana totalmente grátis" },
      { title: "15% OFF plano trimestral", coupon_type: "STORE", discount_percent: 15, value_rescue: 150, image_url: "", description: "Desconto no plano de 3 meses" },
    ],
    catalog: [
      { name: "Plano Mensal", price: 89.90, description: "Acesso ilimitado por 30 dias", image_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop", category: "Planos" },
      { name: "Plano Trimestral", price: 239.90, description: "3 meses com desconto", image_url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop", category: "Planos" },
    ],
  },
  {
    name: "Padaria Pão Quente", slug: "padaria-pao-quente", segment: "Padaria",
    description: "Pães frescos, bolos, salgados e cafés especiais toda manhã.", store_type: "RECEPTORA", color: "F9A825",
    offers: [
      { title: "Café + Pão na Chapa R$7,90", coupon_type: "PRODUCT", discount_percent: 20, value_rescue: 10, image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop", description: "Combo café da manhã especial" },
    ],
  },
  {
    name: "Gelato Art", slug: "gelato-art", segment: "Sorveteria",
    description: "Sorvetes artesanais italianos com frutas frescas e ingredientes naturais.", store_type: "RECEPTORA", color: "E91E63",
    offers: [
      { title: "Casquinha dupla por R$12", coupon_type: "PRODUCT", discount_percent: 15, value_rescue: 15, image_url: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&h=300&fit=crop", description: "Duas bolas na casquinha artesanal" },
      { title: "10% OFF no quilo", coupon_type: "STORE", discount_percent: 10, value_rescue: 20, image_url: "", description: "Desconto no sorvete por quilo" },
    ],
  },
  {
    name: "Sushi Kaze", slug: "sushi-kaze", segment: "Restaurante Japonês",
    description: "Culinária japonesa autêntica com peixes frescos importados.", store_type: "MISTA", color: "B71C1C",
    offers: [
      { title: "Combo 30 peças por R$69,90", coupon_type: "PRODUCT", discount_percent: 20, value_rescue: 70, image_url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop", description: "Combinado especial com 30 peças variadas" },
    ],
    catalog: [
      { name: "Combo Tradicional 20pcs", price: 54.90, description: "Sushis e sashimis variados", image_url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop", category: "Combos" },
      { name: "Temaki Salmão", price: 24.90, description: "Temaki de salmão com cream cheese", image_url: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&h=300&fit=crop", category: "Temakis" },
    ],
  },
  {
    name: "Café Aroma", slug: "cafe-aroma", segment: "Cafeteria",
    description: "Cafés especiais, cappuccinos artesanais e doces finos.", store_type: "RECEPTORA", color: "4E342E",
    offers: [
      { title: "Cappuccino + brownie R$16,90", coupon_type: "PRODUCT", discount_percent: 15, value_rescue: 18, image_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop", description: "Combo perfeito para a tarde" },
    ],
  },
  {
    name: "Moda Style", slug: "moda-style", segment: "Loja de Roupas",
    description: "Moda feminina e masculina com as últimas tendências.", store_type: "RECEPTORA", color: "8E24AA",
    offers: [
      { title: "20% OFF coleção nova", coupon_type: "STORE", discount_percent: 20, value_rescue: 80, image_url: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=300&fit=crop", description: "Desconto em toda coleção primavera/verão" },
      { title: "Compre 2 leve 3", coupon_type: "STORE", discount_percent: 33, value_rescue: 60, image_url: "", description: "Promoção especial em peças selecionadas" },
    ],
  },
  {
    name: "Ótica VisionPlus", slug: "otica-visionplus", segment: "Ótica",
    description: "Óculos de grau e sol das melhores marcas com exame gratuito.", store_type: "RECEPTORA", color: "1565C0",
    offers: [
      { title: "Exame de vista gratuito", coupon_type: "STORE", discount_percent: 100, value_rescue: 100, image_url: "https://images.unsplash.com/photo-1574258495973-f7977603b6d2?w=400&h=300&fit=crop", description: "Exame completo grátis na compra de armação" },
    ],
  },
  {
    name: "LavandeRia Express", slug: "lavanderia-express", segment: "Lavanderia",
    description: "Lavagem a seco, passadoria e entrega em domicílio.", store_type: "RECEPTORA", color: "0097A7",
    offers: [
      { title: "1ª lavagem com 30% OFF", coupon_type: "STORE", discount_percent: 30, value_rescue: 40, image_url: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=400&h=300&fit=crop", description: "Desconto para novos clientes" },
    ],
  },
  {
    name: "Auto Center Mestre", slug: "auto-center-mestre", segment: "Oficina Mecânica",
    description: "Revisão completa, troca de óleo, pneus e diagnóstico eletrônico.", store_type: "RECEPTORA", color: "546E7A",
    offers: [
      { title: "Revisão + troca de óleo R$149", coupon_type: "PRODUCT", discount_percent: 25, value_rescue: 150, image_url: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400&h=300&fit=crop", description: "Revisão completa com troca de óleo inclusa" },
    ],
  },
  {
    name: "Flora & Jardim", slug: "flora-e-jardim", segment: "Floricultura",
    description: "Arranjos florais, plantas ornamentais e decoração para eventos.", store_type: "RECEPTORA", color: "43A047",
    offers: [
      { title: "Buquê de rosas por R$49,90", coupon_type: "PRODUCT", discount_percent: 20, value_rescue: 50, image_url: "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=400&h=300&fit=crop", description: "Buquê com 12 rosas vermelhas" },
    ],
  },
  {
    name: "Livraria Palavra Viva", slug: "livraria-palavra-viva", segment: "Livraria",
    description: "Best-sellers, clássicos, HQs e papelaria fina.", store_type: "RECEPTORA", color: "6D4C41",
    offers: [
      { title: "Leve 3 pague 2 em livros", coupon_type: "STORE", discount_percent: 33, value_rescue: 50, image_url: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=300&fit=crop", description: "Promoção especial em títulos selecionados" },
    ],
  },
  {
    name: "Papelaria Criativa", slug: "papelaria-criativa", segment: "Papelaria",
    description: "Material escolar, escritório, artesanato e presentes criativos.", store_type: "RECEPTORA", color: "FF7043",
    offers: [
      { title: "Kit escolar com 15% OFF", coupon_type: "STORE", discount_percent: 15, value_rescue: 30, image_url: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&h=300&fit=crop", description: "Desconto no kit escolar completo" },
    ],
  },
  {
    name: "Açaí da Terra", slug: "acai-da-terra", segment: "Açaíteria",
    description: "Açaí puro do Pará com frutas frescas e complementos premium.", store_type: "MISTA", color: "4A148C",
    offers: [
      { title: "Açaí 500ml + complemento grátis", coupon_type: "PRODUCT", discount_percent: 15, value_rescue: 22, image_url: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&h=300&fit=crop", description: "Açaí cremoso com 1 complemento por conta da casa" },
    ],
    catalog: [
      { name: "Açaí 300ml", price: 14.90, description: "Açaí puro com granola e banana", image_url: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&h=300&fit=crop", category: "Açaís" },
      { name: "Açaí 500ml", price: 21.90, description: "Açaí turbinado com frutas", image_url: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&h=300&fit=crop", category: "Açaís" },
    ],
  },
  {
    name: "Cervejaria Hop Lab", slug: "cervejaria-hop-lab", segment: "Cervejaria",
    description: "Cervejas artesanais de fabricação própria com estilos variados.", store_type: "EMISSORA", color: "E65100",
    offers: [
      { title: "Pint artesanal por R$14,90", coupon_type: "PRODUCT", discount_percent: 25, value_rescue: 15, image_url: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=300&fit=crop", description: "Qualquer estilo de cerveja artesanal" },
    ],
    catalog: [
      { name: "IPA Tropical 600ml", price: 24.90, description: "Cerveja IPA com notas tropicais", image_url: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=300&fit=crop", category: "Cervejas" },
      { name: "Pilsen Premium 1L", price: 18.90, description: "Pilsen leve e refrescante", image_url: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=300&fit=crop", category: "Cervejas" },
    ],
  },
  {
    name: "Doce Mania", slug: "doce-mania", segment: "Doceria",
    description: "Brigadeiros gourmet, bolos decorados e doces finos para festas.", store_type: "RECEPTORA", color: "F06292",
    offers: [
      { title: "Caixa 25 brigadeiros R$39,90", coupon_type: "PRODUCT", discount_percent: 20, value_rescue: 40, image_url: "https://images.unsplash.com/photo-1558326567-98ae2405596b?w=400&h=300&fit=crop", description: "Brigadeiros gourmet sortidos" },
    ],
  },
  {
    name: "Clínica Belezza", slug: "clinica-belezza", segment: "Clínica Estética",
    description: "Procedimentos estéticos, limpeza de pele e harmonização facial.", store_type: "RECEPTORA", color: "AD1457",
    offers: [
      { title: "Limpeza de pele por R$89", coupon_type: "PRODUCT", discount_percent: 30, value_rescue: 90, image_url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop", description: "Limpeza de pele profunda com hidratação" },
      { title: "10% OFF harmonização", coupon_type: "STORE", discount_percent: 10, value_rescue: 200, image_url: "", description: "Desconto em procedimentos de harmonização" },
    ],
  },
  {
    name: "OdontoSmile", slug: "odontosmile", segment: "Dentista",
    description: "Clínica odontológica com clareamento, implantes e ortodontia.", store_type: "RECEPTORA", color: "00838F",
    offers: [
      { title: "Avaliação + limpeza gratuita", coupon_type: "STORE", discount_percent: 100, value_rescue: 120, image_url: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=400&h=300&fit=crop", description: "Primeira consulta e limpeza sem custo" },
    ],
  },
  {
    name: "Studio Hair", slug: "studio-hair", segment: "Salão de Beleza",
    description: "Cortes, coloração, hidratação e tratamentos capilares.", store_type: "RECEPTORA", color: "C62828",
    offers: [
      { title: "Escova + hidratação R$59", coupon_type: "PRODUCT", discount_percent: 20, value_rescue: 60, image_url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop", description: "Escova modelada com hidratação profunda" },
    ],
  },
  {
    name: "Mercadinho Bom Preço", slug: "mercadinho-bom-preco", segment: "Mercadinho",
    description: "Hortifruti frescos, carnes selecionadas e produtos do dia a dia.", store_type: "EMISSORA", color: "2E7D32",
    offers: [
      { title: "5% OFF acima de R$100", coupon_type: "STORE", discount_percent: 5, value_rescue: 15, image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop", description: "Desconto em compras acima de R$100" },
    ],
    catalog: [
      { name: "Cesta Básica Completa", price: 189.90, description: "30 itens essenciais do mês", image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop", category: "Cestas" },
    ],
  },
  {
    name: "Pé de Ouro", slug: "pe-de-ouro", segment: "Loja de Calçados",
    description: "Calçados femininos, masculinos e infantis das melhores marcas.", store_type: "RECEPTORA", color: "5D4037",
    offers: [
      { title: "2º par com 50% OFF", coupon_type: "STORE", discount_percent: 50, value_rescue: 80, image_url: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=300&fit=crop", description: "Compre um par e ganhe 50% no segundo" },
    ],
  },
  {
    name: "Casa de Carnes Nobre", slug: "casa-de-carnes-nobre", segment: "Casa de Carnes",
    description: "Carnes premium, cortes especiais e embutidos artesanais.", store_type: "RECEPTORA", color: "BF360C",
    offers: [
      { title: "Kit Churrasco R$89,90", coupon_type: "PRODUCT", discount_percent: 15, value_rescue: 90, image_url: "https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400&h=300&fit=crop", description: "Kit completo para churrasco de 10 pessoas" },
    ],
  },
  {
    name: "TechStore", slug: "techstore", segment: "Loja de Eletrônicos",
    description: "Smartphones, notebooks, acessórios e assistência técnica.", store_type: "RECEPTORA", color: "1A237E",
    offers: [
      { title: "10% OFF em acessórios", coupon_type: "STORE", discount_percent: 10, value_rescue: 50, image_url: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=300&fit=crop", description: "Desconto em capas, fones e carregadores" },
    ],
  },
  {
    name: "Trattoria Italiana", slug: "trattoria-italiana", segment: "Restaurante Italiano",
    description: "Massas frescas, risotos cremosos e vinhos italianos selecionados.", store_type: "MISTA", color: "C62828",
    offers: [
      { title: "Massa + vinho por R$59,90", coupon_type: "PRODUCT", discount_percent: 20, value_rescue: 60, image_url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop", description: "Qualquer massa com taça de vinho" },
    ],
    catalog: [
      { name: "Fettuccine Alfredo", price: 42.90, description: "Massa fresca ao molho branco com parmesão", image_url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop", category: "Massas" },
      { name: "Risoto de Funghi", price: 48.90, description: "Risoto cremoso com mix de cogumelos", image_url: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop", category: "Risotos" },
    ],
  },
  {
    name: "Churrascaria Fogo Nobre", slug: "churrascaria-fogo-nobre", segment: "Churrascaria",
    description: "Rodízio completo de carnes nobres com buffet de saladas.", store_type: "RECEPTORA", color: "DD2C00",
    offers: [
      { title: "Rodízio por R$59,90/pessoa", coupon_type: "PRODUCT", discount_percent: 15, value_rescue: 60, image_url: "https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=300&fit=crop", description: "Rodízio completo com sobremesa inclusa" },
    ],
  },
  {
    name: "Brink Kids", slug: "brink-kids", segment: "Loja de Brinquedos",
    description: "Brinquedos educativos, jogos de tabuleiro e diversão garantida.", store_type: "RECEPTORA", color: "FF6F00",
    offers: [
      { title: "20% OFF em jogos", coupon_type: "STORE", discount_percent: 20, value_rescue: 40, image_url: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=300&fit=crop", description: "Desconto em jogos de tabuleiro e cartas" },
    ],
  },
  {
    name: "Beleza Natural", slug: "beleza-natural", segment: "Loja de Cosméticos",
    description: "Maquiagem, skincare, perfumes e produtos de beleza importados.", store_type: "RECEPTORA", color: "880E4F",
    offers: [
      { title: "Kit Skincare com 25% OFF", coupon_type: "PRODUCT", discount_percent: 25, value_rescue: 70, image_url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop", description: "Kit limpeza + hidratante + protetor solar" },
    ],
  },
  {
    name: "Ink Masters", slug: "ink-masters", segment: "Estúdio de Tatuagem",
    description: "Tatuagens artísticas, coberturas e piercings com profissionais premiados.", store_type: "RECEPTORA", color: "212121",
    offers: [
      { title: "Flash tattoo por R$150", coupon_type: "PRODUCT", discount_percent: 30, value_rescue: 150, image_url: "https://images.unsplash.com/photo-1590246814883-57764a8a0d4a?w=400&h=300&fit=crop", description: "Tatuagens de designs prontos do estúdio" },
    ],
  },
  {
    name: "English Now", slug: "english-now", segment: "Escola de Idiomas",
    description: "Cursos de inglês, espanhol e francês para todas as idades.", store_type: "EMISSORA", color: "0D47A1",
    offers: [
      { title: "Aula experimental grátis", coupon_type: "STORE", discount_percent: 100, value_rescue: 50, image_url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop", description: "1 aula experimental sem compromisso" },
    ],
    catalog: [
      { name: "Curso Regular Mensal", price: 299.90, description: "2x por semana, turmas reduzidas", image_url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop", category: "Cursos" },
      { name: "Intensivo 1 Mês", price: 499.90, description: "Aulas diárias por 1 mês", image_url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop", category: "Cursos" },
    ],
  },
  {
    name: "Power Suplementos", slug: "power-suplementos", segment: "Loja de Suplementos",
    description: "Whey protein, creatina, BCAA e suplementos das melhores marcas.", store_type: "RECEPTORA", color: "F57F17",
    offers: [
      { title: "Whey 1kg com 10% OFF", coupon_type: "PRODUCT", discount_percent: 10, value_rescue: 25, image_url: "https://images.unsplash.com/photo-1593095948071-474c5cc2c4d8?w=400&h=300&fit=crop", description: "Whey Protein concentrado 1kg" },
    ],
  },
  {
    name: "Adega Bacchus", slug: "adega-bacchus", segment: "Loja de Vinhos",
    description: "Vinhos nacionais e importados, espumantes e destilados premium.", store_type: "RECEPTORA", color: "4A148C",
    offers: [
      { title: "2 vinhos por R$99,90", coupon_type: "PRODUCT", discount_percent: 25, value_rescue: 100, image_url: "https://images.unsplash.com/photo-1474722883778-792e7990302f?w=400&h=300&fit=crop", description: "Seleção especial de vinhos tintos e brancos" },
    ],
  },
  {
    name: "Verde Vegan", slug: "verde-vegan", segment: "Restaurante Vegano",
    description: "Culinária vegana criativa com ingredientes orgânicos e locais.", store_type: "MISTA", color: "33691E",
    offers: [
      { title: "Prato executivo R$24,90", coupon_type: "PRODUCT", discount_percent: 15, value_rescue: 25, image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop", description: "Prato do dia com entrada e sobremesa" },
    ],
    catalog: [
      { name: "Bowl Proteico", price: 32.90, description: "Grão de bico, quinoa, legumes grelhados", image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop", category: "Bowls" },
      { name: "Hambúrguer Vegano", price: 28.90, description: "Blend de grão de bico com especiarias", image_url: "https://images.unsplash.com/photo-1520072959219-c595e6cdc07a?w=400&h=300&fit=crop", category: "Lanches" },
    ],
  },
  {
    name: "Pastelão do Zé", slug: "pastelao-do-ze", segment: "Pastelaria",
    description: "Pastéis gigantes crocantes com recheios tradicionais e especiais.", store_type: "RECEPTORA", color: "E65100",
    offers: [
      { title: "Pastel + caldo de cana R$12", coupon_type: "PRODUCT", discount_percent: 20, value_rescue: 12, image_url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop", description: "Combo tradicional de feira" },
    ],
  },
  {
    name: "Cell Fix", slug: "cell-fix", segment: "Loja de Celulares",
    description: "Assistência técnica, capas, películas e acessórios para celular.", store_type: "RECEPTORA", color: "263238",
    offers: [
      { title: "Troca de tela com 15% OFF", coupon_type: "PRODUCT", discount_percent: 15, value_rescue: 60, image_url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop", description: "Reparo de tela para qualquer modelo" },
    ],
  },
  {
    name: "Confeitaria Doce Sonho", slug: "confeitaria-doce-sonho", segment: "Confeitaria",
    description: "Bolos personalizados, tortas e doces finos para festas e eventos.", store_type: "RECEPTORA", color: "D81B60",
    offers: [
      { title: "Bolo festa 3kg por R$129", coupon_type: "PRODUCT", discount_percent: 20, value_rescue: 130, image_url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop", description: "Bolo decorado para até 30 pessoas" },
    ],
  },
  {
    name: "Lanchonete Sabor", slug: "lanchonete-sabor", segment: "Lanchonete",
    description: "Lanches rápidos, porções generosas e pratos feitos caseiros.", store_type: "RECEPTORA", color: "F4511E",
    offers: [
      { title: "Prato feito R$18,90", coupon_type: "PRODUCT", discount_percent: 10, value_rescue: 19, image_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop", description: "Prato do dia com arroz, feijão, carne e salada" },
      { title: "10% OFF no delivery", coupon_type: "STORE", discount_percent: 10, value_rescue: 10, image_url: "", description: "Desconto em pedidos para entrega" },
    ],
  },
];

// ─── Main Handler ────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify caller is root_admin
    const { data: { user: callerUser }, error: userErr } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !callerUser) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerUserId = callerUser.id;

    const { data: isRoot } = await supabaseAdmin.rpc("has_role", {
      _user_id: callerUserId,
      _role: "root_admin",
    });
    if (!isRoot) {
      return new Response(JSON.stringify({ error: "Forbidden: root_admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      company_name,
      brand_slug,
      city_name,
      city_slug,
      state,
      subdomain,
      logo_url,
      primary_color,
      secondary_color,
      test_points = 1000,
      enable_demo_stores = true,
      enable_test_credits = true,
      selected_sections,
      admin_email: customAdminEmail,
      admin_password: customAdminPassword,
    } = body;

    if (!company_name || !brand_slug || !city_name || !city_slug) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailPrefix = brand_slug.replace(/[^a-z0-9]/g, "");

    // ─── 1. Tenant ───────────────────────────────────────────────
    const tenantSlug = brand_slug;
    let tenant: { id: string };
    const { data: existingTenant } = await supabaseAdmin
      .from("tenants").select("id").eq("slug", tenantSlug).maybeSingle();
    if (existingTenant) {
      tenant = existingTenant;
    } else {
      const { data: newTenant, error: tenantErr } = await supabaseAdmin
        .from("tenants").insert({ name: company_name, slug: tenantSlug }).select("id").single();
      if (tenantErr) throw new Error(`Tenant: ${tenantErr.message}`);
      tenant = newTenant;
    }

    // ─── 2. Brand ────────────────────────────────────────────────
    const brandSettings = {
      logo_url: logo_url || null,
      primary_color: primary_color || "#6366f1",
      secondary_color: secondary_color || "#f59e0b",
      test_accounts: [] as any[],
    };
    let brand: { id: string };
    const { data: existingBrand } = await supabaseAdmin
      .from("brands").select("id").eq("tenant_id", tenant.id).eq("slug", brand_slug).maybeSingle();
    if (existingBrand) {
      brand = existingBrand;
    } else {
      const { data: newBrand, error: brandErr } = await supabaseAdmin
        .from("brands").insert({ name: company_name, slug: brand_slug, tenant_id: tenant.id, brand_settings_json: brandSettings }).select("id").single();
      if (brandErr) throw new Error(`Brand: ${brandErr.message}`);
      brand = newBrand;
    }

    // ─── 3. Branch ───────────────────────────────────────────────
    let branch: { id: string };
    const { data: existingBranch } = await supabaseAdmin
      .from("branches").select("id").eq("brand_id", brand.id).eq("slug", city_slug).maybeSingle();
    if (existingBranch) {
      branch = existingBranch;
    } else {
      const { data: newBranch, error: branchErr } = await supabaseAdmin
        .from("branches").insert({ name: city_name, slug: city_slug, brand_id: brand.id, city: city_name, state: state || null }).select("id").single();
      if (branchErr) throw new Error(`Branch: ${branchErr.message}`);
      branch = newBranch;
    }

    // ─── 4. Domain ───────────────────────────────────────────────
    const domainValue = subdomain ? `${subdomain}.valeresgate.com.br` : `${brand_slug}.valeresgate.com.br`;
    const { data: existingDomain } = await supabaseAdmin
      .from("brand_domains").select("id").eq("brand_id", brand.id).eq("domain", domainValue).maybeSingle();
    if (!existingDomain) {
      await supabaseAdmin.from("brand_domains").insert({
        brand_id: brand.id, domain: domainValue, subdomain: subdomain || brand_slug, is_primary: true,
      });
    }

    // ─── Helper: get or create user ─────────────────────────────
    const getOrCreateUser = async (email: string, fullName: string) => {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email, password: "123456", email_confirm: true, user_metadata: { full_name: fullName },
      });
      if (created?.user) return created.user;
      if (createErr?.message?.includes("already been registered")) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existing = listData?.users?.find((u: any) => u.email === email);
        if (existing) return existing;
      }
      throw new Error(`User ${email}: ${createErr?.message}`);
    };

    // ─── 5. Admin test user ─────────────────────────────────────
    const adminEmail = customAdminEmail || `teste-${emailPrefix}@teste.com`;
    const adminPassword = customAdminPassword || "123456";
    const adminUser = await (async () => {
      if (customAdminEmail) {
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: adminEmail, password: adminPassword, email_confirm: true, user_metadata: { full_name: `Admin ${company_name}` },
        });
        if (created?.user) return created.user;
        if (createErr?.message?.includes("already been registered")) {
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const existing = listData?.users?.find((u: any) => u.email === adminEmail);
          if (existing) return existing;
        }
        throw new Error(`Admin user: ${createErr?.message}`);
      }
      return getOrCreateUser(adminEmail, `Admin ${company_name}`);
    })();
    await supabaseAdmin.from("profiles").update({ brand_id: brand.id, tenant_id: tenant.id }).eq("id", adminUser.id);
    await supabaseAdmin.from("user_roles").upsert(
      { user_id: adminUser.id, role: "brand_admin", brand_id: brand.id, tenant_id: tenant.id },
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );

    // ─── 6. Customer test user ──────────────────────────────────
    const customerEmail = `cliente-${emailPrefix}@teste.com`;
    const customerUser = await getOrCreateUser(customerEmail, "Cliente Teste");
    let customer: { id: string };
    const { data: existingCust } = await supabaseAdmin
      .from("customers").select("id").eq("user_id", customerUser.id).eq("brand_id", brand.id).maybeSingle();
    if (existingCust) {
      customer = existingCust;
    } else {
      const pointsToGive = enable_test_credits ? test_points : 0;
      const { data: newCust, error: custErr } = await supabaseAdmin
        .from("customers").insert({ name: "Cliente Teste", user_id: customerUser.id, brand_id: brand.id, branch_id: branch.id, points_balance: pointsToGive }).select("id").single();
      if (custErr) throw new Error(`Customer: ${custErr.message}`);
      customer = newCust;
      if (enable_test_credits) { await supabaseAdmin.from("points_ledger").insert({
        customer_id: customer.id, brand_id: brand.id, branch_id: branch.id, points_amount: test_points,
        entry_type: "CREDIT", reference_type: "MANUAL", reason: "Crédito inicial de teste", created_by_user_id: callerUserId,
      });
    }
    }
    await supabaseAdmin.from("user_roles").upsert(
      { user_id: customerUser.id, role: "customer" },
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );

    // ─── 7. Store test user ─────────────────────────────────────
    const storeEmail = `loja-${emailPrefix}@teste.com`;
    const storeUser = await getOrCreateUser(storeEmail, "Loja Teste");
    const { data: existingStore } = await supabaseAdmin
      .from("stores").select("id").eq("owner_user_id", storeUser.id).eq("brand_id", brand.id).maybeSingle();
    if (!existingStore) {
      await supabaseAdmin.from("stores").insert({
        name: "Loja Teste Demo", slug: `loja-teste-${emailPrefix}`, brand_id: brand.id, branch_id: branch.id,
        owner_user_id: storeUser.id, approval_status: "APPROVED", is_active: true,
        approved_at: new Date().toISOString(), description: "Parceiro de demonstração criado automaticamente.", email: storeEmail,
      });
    }
    await supabaseAdmin.from("user_roles").upsert(
      { user_id: storeUser.id, role: "store_admin" },
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );

    // ─── 8. Enable modules based on plan_module_templates ─────
    // Fonte única de verdade: tabela plan_module_templates (mesmo padrão usado em
    // stripe-webhook e apply-plan-template). Aceita plano vindo do body.
    const requestedPlan = (body as any).subscription_plan;
    const validPlans = ["free", "starter", "profissional", "enterprise"];
    let plan_key: string;
    if (typeof requestedPlan === "string" && validPlans.includes(requestedPlan)) {
      plan_key = requestedPlan;
      // Persiste o plano escolhido na brand
      await supabaseAdmin.from("brands")
        .update({ subscription_plan: plan_key })
        .eq("id", brand.id);
    } else {
      const { data: brandRow } = await supabaseAdmin
        .from("brands").select("subscription_plan").eq("id", brand.id).single();
      plan_key = brandRow?.subscription_plan && validPlans.includes(brandRow.subscription_plan)
        ? brandRow.subscription_plan
        : "free";
    }

    // Lê o template do plano
    const { data: planTemplates } = await supabaseAdmin
      .from("plan_module_templates")
      .select("module_definition_id, is_enabled")
      .eq("plan_key", plan_key);

    // Garante módulos core sempre ON
    const { data: coreMods } = await supabaseAdmin
      .from("module_definitions").select("id")
      .eq("is_active", true).eq("is_core", true);
    const coreIds = new Set((coreMods || []).map((m: any) => m.id));

    // Substitui brand_modules pelo template (idempotente para brand recém-criada)
    await supabaseAdmin.from("brand_modules").delete().eq("brand_id", brand.id);
    if (planTemplates && planTemplates.length > 0) {
      await supabaseAdmin.from("brand_modules").insert(
        planTemplates.map((t: any, i: number) => ({
          brand_id: brand.id,
          module_definition_id: t.module_definition_id,
          is_enabled: coreIds.has(t.module_definition_id) ? true : t.is_enabled,
          order_index: i,
        })),
      );
    }

    // ─── 8b. Seed default tier points rules (1pt per R$1) ──────
    const TIER_KEYS = ["INICIANTE", "BRONZE", "PRATA", "OURO", "DIAMANTE", "LENDARIO", "GALATICO"];
    const { data: existingTierRules } = await supabaseAdmin
      .from("tier_points_rules").select("id").eq("brand_id", brand.id).eq("branch_id", branch.id).limit(1);
    if (!existingTierRules || existingTierRules.length === 0) {
      await supabaseAdmin.from("tier_points_rules").insert(
        TIER_KEYS.map((tier) => ({
          brand_id: brand.id,
          branch_id: branch.id,
          tier,
          points_per_real: 1,
          is_active: true,
        })),
      );
    }

    // ─── 9. Apply default home template (8 seções padrão) ──────
    const { data: defaultTemplate } = await supabaseAdmin
      .from("home_template_library").select("id, template_payload_json")
      .eq("is_default", true).eq("is_active", true).limit(1).maybeSingle();
    if (defaultTemplate) {
      const payload = defaultTemplate.template_payload_json as any;
      if (payload?.sections && Array.isArray(payload.sections)) {
        const selectedSet = Array.isArray(selected_sections) ? new Set(selected_sections as number[]) : null;
        for (let i = 0; i < payload.sections.length; i++) {
          const s = payload.sections[i];
          const isEnabled = selectedSet ? selectedSet.has(i) : true;
          const { data: newSection } = await supabaseAdmin.from("brand_sections").insert({
            brand_id: brand.id, template_id: s.template_id, title: s.title || null,
            subtitle: s.subtitle || null, order_index: i, is_enabled: isEnabled,
            display_mode: s.display_mode || "carousel",
            rows_count: s.rows_count || 1, columns_count: s.columns_count || 4,
            segment_filter_ids: s.segment_filter_ids || null,
            visual_json: s.visual_json || {},
          }).select("id").single();
          // Create source for the section
          if (newSection && s.source_type) {
            await supabaseAdmin.from("brand_section_sources").insert({
              brand_section_id: newSection.id,
              source_type: s.source_type,
              limit: s.source_limit || 12,
            });
          }
        }
      }
    }

    // ─── 10. Create demo stores with offers & catalogs ─────────
    const log = createEdgeLogger("provision-brand");
    if (!enable_demo_stores) {
      log.info("Demo stores skipped (disabled by user)");
    } else {
    log.info("Creating demo stores...");
    for (const demo of DEMO_STORES) {
      const storeSlug = `${demo.slug}-${emailPrefix}`;
      const logoUrl = logo(demo.name, demo.color);

      // Check if store already exists
      const { data: existingDemo } = await supabaseAdmin
        .from("stores").select("id").eq("brand_id", brand.id).eq("slug", storeSlug).maybeSingle();
      if (existingDemo) continue;

      // Create store
      const { data: newStore, error: storeErr } = await supabaseAdmin
        .from("stores").insert({
          name: demo.name,
          slug: storeSlug,
          brand_id: brand.id,
          branch_id: branch.id,
          logo_url: logoUrl,
          segment: demo.segment,
          description: demo.description,
          store_type: demo.store_type,
          approval_status: "APPROVED",
          is_active: true,
          approved_at: new Date().toISOString(),
          email: `${demo.slug}@demo.com`,
        }).select("id").single();

      if (storeErr) {
        log.error("Store creation failed", { name: demo.name, error: storeErr.message });
        continue;
      }

      // Create offers for this store
      for (const offer of demo.offers) {
        const imageUrl = offer.image_url || logoUrl;
        await supabaseAdmin.from("offers").insert({
          title: offer.title,
          description: offer.description,
          coupon_type: offer.coupon_type,
          discount_percent: offer.discount_percent,
          value_rescue: offer.value_rescue,
          image_url: imageUrl,
          store_id: newStore.id,
          brand_id: brand.id,
          branch_id: branch.id,
          status: "ACTIVE",
          is_active: true,
          allowed_weekdays: [0, 1, 2, 3, 4, 5, 6],
        });
      }

      // Create catalog items for EMISSORA/MISTA stores
      if (demo.catalog && demo.catalog.length > 0 && (demo.store_type === "EMISSORA" || demo.store_type === "MISTA")) {
        for (let ci = 0; ci < demo.catalog.length; ci++) {
          const item = demo.catalog[ci];
          await supabaseAdmin.from("store_catalog_items").insert({
            name: item.name,
            price: item.price,
            description: item.description,
            image_url: item.image_url,
            category: item.category,
            store_id: newStore.id,
            brand_id: brand.id,
            branch_id: branch.id,
            is_active: true,
            order_index: ci,
          });
        }
      }
    }
    log.info("Demo stores created successfully", { count: DEMO_STORES.length });

    // ─── Seed Affiliate Deals (Achadinhos) ─────────────────────
    const { data: existingDeals } = await supabaseAdmin
      .from("affiliate_deals").select("id").eq("brand_id", brand.id).limit(1);

    if (!existingDeals?.length) {
      await supabaseAdmin.rpc("seed_affiliate_categories", { p_brand_id: brand.id });

      const { data: dealCategories } = await supabaseAdmin
        .from("affiliate_deal_categories").select("id, name").eq("brand_id", brand.id);
      const dealCatMap = new Map<string, string>();
      for (const dc of (dealCategories || [])) {
        dealCatMap.set(dc.name.toLowerCase(), dc.id);
      }

      const DEMO_DEALS = [
        { title: "Fone Bluetooth JBL Tune 520BT", price: 199.90, original_price: 299.90, image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop", category: "Eletrônicos", store_name: "Mercado Livre", affiliate_url: "https://mercadolivre.com.br", description: "Fone sem fio com até 57h de bateria", badge_label: "-33%" },
        { title: "Air Fryer Philips 4.1L", price: 349.90, original_price: 499.90, image_url: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=300&fit=crop", category: "Cozinha", store_name: "Mercado Livre", affiliate_url: "https://mercadolivre.com.br", description: "Fritadeira sem óleo 1400W", badge_label: "-30%" },
        { title: "Tênis Nike Revolution 6", price: 249.90, original_price: 399.90, image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop", category: "Esportes", store_name: "Mercado Livre", affiliate_url: "https://mercadolivre.com.br", description: "Tênis de corrida leve e confortável", badge_label: "-37%" },
        { title: "Kit Skincare Facial Completo", price: 89.90, original_price: 149.90, image_url: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=300&fit=crop", category: "Beleza", store_name: "Mercado Livre", affiliate_url: "https://mercadolivre.com.br", description: "Sérum + hidratante + protetor solar", badge_label: "-40%" },
        { title: "Smartwatch Xiaomi Band 8", price: 179.90, original_price: 249.90, image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop", category: "Eletrônicos", store_name: "Mercado Livre", affiliate_url: "https://mercadolivre.com.br", description: "Monitor cardíaco, SpO2 e 16 dias de bateria", badge_label: "-28%" },
        { title: "Cafeteira Nespresso Essenza Mini", price: 399.90, original_price: 599.90, image_url: "https://images.unsplash.com/photo-1517256064527-9d164d25e6ac?w=400&h=300&fit=crop", category: "Cozinha", store_name: "Mercado Livre", affiliate_url: "https://mercadolivre.com.br", description: "Cafeteira de cápsulas compacta 19 bar", badge_label: "-33%" },
        { title: "Mochila Notebook Executiva", price: 129.90, original_price: 199.90, image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop", category: "Moda", store_name: "Mercado Livre", affiliate_url: "https://mercadolivre.com.br", description: "Mochila anti-furto com USB para notebook 15.6\"", badge_label: "-35%" },
        { title: "Whey Protein Gold Standard 907g", price: 189.90, original_price: 279.90, image_url: "https://images.unsplash.com/photo-1593095948071-474c5cc2c4d8?w=400&h=300&fit=crop", category: "Esportes", store_name: "Mercado Livre", affiliate_url: "https://mercadolivre.com.br", description: "Whey Protein isolado sabor chocolate", badge_label: "-32%" },
        { title: "Echo Dot 5ª Geração Alexa", price: 299.90, original_price: 449.90, image_url: "https://images.unsplash.com/photo-1543512214-318c7553f230?w=400&h=300&fit=crop", category: "Eletrônicos", store_name: "Mercado Livre", affiliate_url: "https://mercadolivre.com.br", description: "Smart speaker com Alexa e som premium", badge_label: "-33%" },
        { title: "Conjunto Panelas Antiaderente 5pcs", price: 199.90, original_price: 349.90, image_url: "https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=400&h=300&fit=crop", category: "Cozinha", store_name: "Mercado Livre", affiliate_url: "https://mercadolivre.com.br", description: "Conjunto de panelas com revestimento cerâmico", badge_label: "-43%" },
        { title: "Óculos de Sol Ray-Ban Aviator", price: 449.90, original_price: 699.90, image_url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=300&fit=crop", category: "Moda", store_name: "Mercado Livre", affiliate_url: "https://mercadolivre.com.br", description: "Óculos clássico com lente degradê", badge_label: "-36%" },
        { title: "Colchão Casal Molas Ensacadas", price: 1299.90, original_price: 1999.90, image_url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop", category: "Casa", store_name: "Mercado Livre", affiliate_url: "https://mercadolivre.com.br", description: "Colchão casal D33 com pillow top", badge_label: "-35%" },
        { title: "Perfume Masculino Malbec Gold 100ml", price: 149.90, original_price: 219.90, image_url: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=300&fit=crop", category: "Beleza", store_name: "Mercado Livre", affiliate_url: "https://mercadolivre.com.br", description: "Fragrância amadeirada e sofisticada", badge_label: "-32%" },
        { title: "Bicicleta Aro 29 Shimano 21v", price: 899.90, original_price: 1399.90, image_url: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&h=300&fit=crop", category: "Esportes", store_name: "Mercado Livre", affiliate_url: "https://mercadolivre.com.br", description: "Mountain bike com quadro alumínio", badge_label: "-36%" },
        { title: "Aspirador Robô Inteligente", price: 599.90, original_price: 899.90, image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop", category: "Casa", store_name: "Mercado Livre", affiliate_url: "https://mercadolivre.com.br", description: "Robô aspirador com mapeamento e app", badge_label: "-33%" },
        { title: "Kindle Paperwhite 16GB", price: 549.90, original_price: 749.90, image_url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop", category: "Eletrônicos", store_name: "Mercado Livre", affiliate_url: "https://mercadolivre.com.br", description: "E-reader com tela antirreflexo 6.8\"", badge_label: "-27%" },
        { title: "Bolsa Feminina Couro Ecológico", price: 119.90, original_price: 189.90, image_url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=300&fit=crop", category: "Moda", store_name: "Mercado Livre", affiliate_url: "https://mercadolivre.com.br", description: "Bolsa transversal média com alça ajustável", badge_label: "-37%" },
        { title: "Cama Pet Ortopédica GG", price: 149.90, original_price: 229.90, image_url: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=300&fit=crop", category: "Pet", store_name: "Mercado Livre", affiliate_url: "https://mercadolivre.com.br", description: "Cama ortopédica para cães grandes", badge_label: "-35%" },
        { title: "Luminária de Mesa LED Articulada", price: 79.90, original_price: 129.90, image_url: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400&h=300&fit=crop", category: "Casa", store_name: "Mercado Livre", affiliate_url: "https://mercadolivre.com.br", description: "Luminária com 3 temperaturas de cor e dimmer", badge_label: "-38%" },
        { title: "Kit Churrasco Inox 10 Peças", price: 89.90, original_price: 139.90, image_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop", category: "Cozinha", store_name: "Mercado Livre", affiliate_url: "https://mercadolivre.com.br", description: "Conjunto de espetos, faca e tábua em inox", badge_label: "-36%" },
      ];

      for (let i = 0; i < DEMO_DEALS.length; i++) {
        const deal = DEMO_DEALS[i];
        const categoryId = dealCatMap.get(deal.category.toLowerCase()) || null;
        await supabaseAdmin.from("affiliate_deals").insert({
          brand_id: brand.id,
          title: deal.title,
          description: deal.description,
          price: deal.price,
          original_price: deal.original_price,
          image_url: deal.image_url,
          affiliate_url: deal.affiliate_url,
          store_name: deal.store_name,
          store_logo_url: "https://ui-avatars.com/api/?name=ML&background=FFE600&color=333&size=128&rounded=true&bold=true",
          badge_label: deal.badge_label,
          category_id: categoryId,
          is_active: true,
          order_index: i,
        });
      }
      log.info("Created 20 affiliate deals for brand");
    }

    } // end if enable_demo_stores

    // ─── 11. Driver test user ──────────────────────────────────
    const motoristaEmail = `motorista-${emailPrefix}@teste.com`;
    const motoristaUser = await getOrCreateUser(motoristaEmail, `Motorista Teste`);
    const { data: existingMotorista } = await supabaseAdmin
      .from("customers").select("id").eq("user_id", motoristaUser.id).eq("brand_id", brand.id).maybeSingle();
    if (!existingMotorista) {
      await supabaseAdmin.from("customers").insert({
        name: "[MOTORISTA] Motorista Teste",
        user_id: motoristaUser.id,
        brand_id: brand.id,
        branch_id: branch.id,
        points_balance: 0,
      });
    }
    await supabaseAdmin.from("user_roles").upsert(
      { user_id: motoristaUser.id, role: "customer" },
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );

    // ─── 12. Franchisee test user ─────────────────────────────────
    const franqueadoEmail = `franqueado-${emailPrefix}@teste.com`;
    const franqueadoUser = await getOrCreateUser(franqueadoEmail, "Franqueado Teste");
    await supabaseAdmin.from("profiles").update({ brand_id: brand.id, tenant_id: tenant.id }).eq("id", franqueadoUser.id);
    await supabaseAdmin.from("user_roles").upsert(
      { user_id: franqueadoUser.id, role: "branch_admin", brand_id: brand.id, branch_id: branch.id, tenant_id: tenant.id },
      { onConflict: "user_id,role,tenant_id,brand_id,branch_id", ignoreDuplicates: true },
    );
    await supabaseAdmin.from("branch_points_wallet").upsert(
      { branch_id: branch.id, brand_id: brand.id, balance: 0, total_loaded: 0, total_distributed: 0 },
      { onConflict: "branch_id", ignoreDuplicates: true },
    );

    // ─── 13. Save test accounts in brand settings ────────────────
    const testAccounts = [
      { email: adminEmail, role: "brand_admin", is_active: true },
      { email: customerEmail, role: "customer", is_active: true },
      { email: storeEmail, role: "store_admin", is_active: true },
      { email: motoristaEmail, role: "driver", is_active: true },
      { email: franqueadoEmail, role: "branch_admin", is_active: true },
    ];
    await supabaseAdmin.from("brands").update({
      brand_settings_json: { ...brandSettings, test_accounts: testAccounts },
    }).eq("id", brand.id);

    return new Response(
      JSON.stringify({
        success: true,
        tenant_id: tenant.id,
        brand_id: brand.id,
        branch_id: branch.id,
        domain: domainValue,
        test_accounts: testAccounts,
        demo_stores_count: DEMO_STORES.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    const errLog = createEdgeLogger("provision-brand");
    errLog.error("provision-brand error", { message: err.message });
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
