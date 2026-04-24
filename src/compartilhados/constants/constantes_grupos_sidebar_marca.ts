import { FileText } from "lucide-react";
import type { DefinicaoGrupoSidebar } from "./constantes_menu_sidebar";

/**
 * Definição canônica dos grupos do sidebar da Marca (Brand Console).
 *
 * Movido de `src/components/consoles/BrandSidebar.tsx` para permitir que
 * outras telas (ex.: pré-visualização do Produto Comercial) renderizem o
 * mesmo agrupamento sem duplicar a lista — fonte única de verdade.
 */
export const brandGroupDefs: DefinicaoGrupoSidebar[] = [
  {
    label: "Painel",
    items: ["sidebar.dashboard"],
  },
  {
    label: "Guias & Manuais",
    items: [
      "sidebar.jornada", "sidebar.jornada_emissor",
      { key: "sidebar.modulos", overrides: { defaultTitle: "Módulos" } },
      { key: "sidebar.manuais", overrides: { defaultTitle: "Manuais da Plataforma", moduleKey: undefined } },
    ],
  },
  {
    label: "Cidades",
    items: [
      { key: "sidebar.branches", overrides: { defaultTitle: "Minhas Cidades", url: "/brand-branches" } },
      "sidebar.pacotes_pontos",
      "sidebar.jornada_cidades", "sidebar.onboarding_cidade", "sidebar.configuracao_cidade",
      "sidebar.configuracao_modulos_cidade",
    ],
  },
  {
    label: "Personalização & Vitrine",
    items: [
      "sidebar.tema_marca", "sidebar.galeria_icones", "sidebar.partner_landing",
      "sidebar.welcome_tour", "sidebar.profile_links", "sidebar.offer_card_config",
      "sidebar.page_builder", "sidebar.central_banners",
    ],
  },
  {
    label: "Achadinhos",
    items: [
      "sidebar.achadinhos", "sidebar.categorias_achadinhos",
      { key: "sidebar.espelhamento", overrides: { defaultTitle: "Espelhar Achadinhos" } },
      { key: "sidebar.governanca_ofertas", overrides: { defaultTitle: "Governança de Achadinhos" } },
    ],
  },
  {
    label: "Resgate com Pontos",
    items: ["sidebar.produtos_resgate", "sidebar.pedidos_resgate"],
  },
  {
    label: "Aprovações",
    items: ["sidebar.solicitacoes_emissor", "sidebar.aprovar_regras", "sidebar.catalogo"],
  },
  {
    label: "Comunicação",
    items: ["sidebar.enviar_notificacao"],
  },
  {
    label: "Gestão Comercial",
    items: [
      { key: "sidebar.operador_pdv", overrides: { scoringFilter: "PASSENGER" as const } },
      { key: "sidebar.ofertas", overrides: { scoringFilter: "PASSENGER" as const } },
      { key: "sidebar.resgates", overrides: { scoringFilter: "PASSENGER" as const } },
      { key: "sidebar.cupons", overrides: { scoringFilter: "PASSENGER" as const } },
      { key: "sidebar.parceiros", overrides: { scoringFilter: "PASSENGER" as const } },
      { key: "sidebar.clientes", overrides: { scoringFilter: "PASSENGER" as const } },
      "sidebar.motoristas", "sidebar.compra_pontos_motorista", "sidebar.patrocinados",
      { key: "sidebar.painel_motorista_view", overrides: { scoringFilter: "DRIVER" as const } },
    ],
  },
  {
    label: "Programa de Fidelidade",
    items: [
      { key: "sidebar.pontuar", overrides: { scoringFilter: "PASSENGER" as const } },
      { key: "sidebar.regras_pontos", overrides: { scoringFilter: "PASSENGER" as const } },
      "sidebar.tier_pontos",
      { key: "sidebar.extrato_pontos", overrides: { scoringFilter: "PASSENGER" as const } },
    ],
  },
  {
    label: "Gamificação",
    items: ["sidebar.gamificacao"],
  },
  {
    label: "Cashback Inteligente",
    items: [
      "sidebar.gg_config",
      "sidebar.gg_billing",
      { key: "sidebar.gg_closing", overrides: { icon: FileText } },
      "sidebar.gg_reports",
    ],
  },
  {
    label: "Equipe & Acessos",
    items: ["sidebar.usuarios", "sidebar.central_acessos"],
  },
  {
    label: "Inteligência & Dados",
    items: [
      "sidebar.crm", "sidebar.relatorios", "sidebar.auditoria",
      { key: "sidebar.importar_csv", overrides: { moduleKey: "csv_import" } },
      "sidebar.taxonomia",
    ],
  },
  {
    label: "Integrações & API",
    items: [
      "sidebar.api_keys", "sidebar.api_docs", "sidebar.machine",
      { key: "sidebar.teste_webhook", overrides: { defaultTitle: "Lab Webhook" } },
      "sidebar.api_journey",
    ],
  },
  {
    label: "Configurações",
    items: [
      "sidebar.dominios_marca", "sidebar.configuracoes", "sidebar.painel_motorista",
      { key: "sidebar.subscription", overrides: { defaultTitle: "Meu Plano" } },
    ],
  },
];