/**
 * Template pré-preenchido — Vale Resgate Motorista Premium.
 *
 * Serve como ponto de partida para o usuário criar um produto comercial
 * de prateleira sem começar do zero. Após carregar o template, basta
 * ajustar `plan_key`, `slug` e selecionar nos passos 2 e 3 os modelos
 * de negócio (DRIVER_ONLY) e módulos premium desejados.
 */
import type { ProdutoComercialDraft } from "../types/tipos_produto";

export const TEMPLATE_VALE_RESGATE_MOTORISTA_PREMIUM: ProdutoComercialDraft = {
  plan_key: "vr_motorista_premium",
  label: "Vale Resgate Motorista Premium",
  product_name: "Vale Resgate Motorista Premium",
  slug: "motorista-premium",
  price_cents: 49700, // R$ 497,00/mês
  price_yearly_cents: 497000, // R$ 4.970,00/ano (2 meses grátis)
  trial_days: 30,
  is_popular: true,
  is_active: true,
  is_public_listed: true,
  sort_order: 50,
  features: [
    "Painel completo do motorista com gamificação",
    "Cinturão de Campeão da cidade",
    "Duelos entre motoristas em tempo real",
    "CRM de motoristas com segmentação avançada",
    "Disparos ilimitados de mensagens (WhatsApp + Push)",
    "Achadinhos e ofertas de afiliados",
    "Compre com Pontos (resgate de produtos)",
    "Relatórios detalhados de corridas e pontuação",
  ],
  excluded_features: [
    "Painel do passageiro (apenas motorista)",
    "Programa Ganha-Ganha entre lojistas",
  ],
  landing_config_json: {
    headline: "Fidelize seus motoristas como nunca antes",
    subheadline:
      "A plataforma premium para empresas de mobilidade que querem reter, engajar e premiar seus motoristas com gamificação, cinturão de campeão e CRM avançado.",
    benefits: [
      "🏆 Cinturão de Campeão da cidade — competição mensal automática",
      "⚔️ Duelos em tempo real entre motoristas",
      "🎯 CRM com segmentação por performance e localização",
      "💬 Disparos ilimitados via WhatsApp e Push",
      "🛍️ Marketplace de Achadinhos para os motoristas",
      "🎁 Sistema de resgate de produtos com pontos",
      "📊 Relatórios detalhados de cada corrida",
      "📱 App PWA dedicado, instalável no celular",
    ],
    primary_color: "#E11D48",
    hero_image_url: "",
    cta_label: "Começar 30 dias grátis",
    screenshots: [],
    testimonials: [],
    faq: [
      {
        question: "Quanto tempo leva pra ativar?",
        answer:
          "A ativação é instantânea após a confirmação. Você recebe acesso ao painel admin e o app PWA do motorista fica disponível imediatamente para sua frota.",
      },
      {
        question: "Posso cancelar a qualquer momento?",
        answer:
          "Sim. Sem fidelidade, sem multa. Cancele quando quiser direto pelo painel.",
      },
      {
        question: "O que acontece após os 30 dias de trial?",
        answer:
          "Você decide. Se gostar, ativa a assinatura mensal ou anual (com 2 meses grátis). Se não, seus dados ficam preservados por 60 dias caso queira voltar.",
      },
      {
        question: "Tem limite de motoristas?",
        answer:
          "Não. O plano Premium é ilimitado em número de motoristas, corridas e disparos de mensagens.",
      },
    ],
    comparison_highlights: [
      "Único plano com Cinturão de Campeão",
      "Disparos ilimitados (outros planos têm limite)",
      "CRM avançado incluso",
    ],
  },
  // Relacionamentos: o usuário seleciona manualmente nos passos 2 e 3,
  // pois os IDs (UUIDs) dependem do banco de cada ambiente.
  business_model_ids: [],
  module_definition_ids: [],
};