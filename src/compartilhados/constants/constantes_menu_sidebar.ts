import {
  ShoppingBag, Tag, UserCheck, ReceiptText, LayoutDashboard, Ticket,
  FileSpreadsheet, Coins, ScrollText, Settings2, ClipboardCheck, ClipboardList,
  ScanLine, PackageSearch, BarChart3, Bell, BookOpen, ShoppingCart, FolderHeart,
  Swords, Building2, Store, MapPin, Users, Globe, Blocks, Layout, Flag, Rocket,
  LayoutList, Copy, Shield, ShieldCheck, Eye, TrendingUp, FlaskConical,
  FileText, Key, Car, ExternalLink, Palette, AppWindow, GalleryHorizontal,
  CreditCard, DollarSign, Zap, Handshake, FolderTree, Layers, Grip,
  LayoutTemplate, FileUp, Truck, Package, RefreshCw, type LucideIcon,
} from "lucide-react";

export interface RegistroItemMenu {
  key: string;
  defaultTitle: string;
  url: string;
  icon: LucideIcon;
  moduleKey?: string;
  scoringFilter?: "DRIVER" | "PASSENGER";
}

/**
 * Registro central único de todos os itens de menu usados nos sidebars.
 * Fonte única da verdade para key, defaultTitle, url, icon, moduleKey e scoringFilter.
 * 
 * Cada sidebar referencia este registro pela key e pode sobrescrever campos localmente.
 */
export const MENU_REGISTRY: Record<string, RegistroItemMenu> = {
  // ─── Dashboard ───
  "sidebar.dashboard": {
    key: "sidebar.dashboard", defaultTitle: "Visão Geral", url: "/", icon: LayoutDashboard,
  },

  // ─── Guias Inteligentes ───
  "sidebar.jornada_root": {
    key: "sidebar.jornada_root", defaultTitle: "Guia Completo", url: "/root-journey", icon: Rocket,
  },
  "sidebar.jornada": {
    key: "sidebar.jornada", defaultTitle: "Guia do Empreendedor", url: "/brand-journey", icon: Store, moduleKey: "guide_brand",
  },
  "sidebar.jornada_emissor": {
    key: "sidebar.jornada_emissor", defaultTitle: "Guia do Emissor", url: "/emitter-journey", icon: Zap, moduleKey: "guide_emitter",
  },

  // ─── Manuais ───
  "sidebar.manuais": {
    key: "sidebar.manuais", defaultTitle: "Manuais", url: "/manuais", icon: BookOpen, moduleKey: "achadinhos_motorista",
  },

  // ─── Organização / Cidades ───
  "sidebar.empresas": {
    key: "sidebar.empresas", defaultTitle: "Empresas", url: "/tenants", icon: Building2,
  },
  "sidebar.marcas": {
    key: "sidebar.marcas", defaultTitle: "Marcas", url: "/brands", icon: Store,
  },
  "sidebar.branches": {
    key: "sidebar.branches", defaultTitle: "Cidades", url: "/branches", icon: MapPin,
  },
  "sidebar.clonar_cidade": {
    key: "sidebar.clonar_cidade", defaultTitle: "Duplicar Região", url: "/clone-branch", icon: Copy,
  },
  "sidebar.dominios": {
    key: "sidebar.dominios", defaultTitle: "Domínios", url: "/domains", icon: Globe,
  },
  "sidebar.painel_motorista": {
    key: "sidebar.painel_motorista", defaultTitle: "Painel do Motorista", url: "/driver-config", icon: Car,
  },
  "sidebar.provisionar_marca": {
    key: "sidebar.provisionar_marca", defaultTitle: "Nova Marca", url: "/provision-brand", icon: Rocket,
  },
  "sidebar.central_acessos": {
    key: "sidebar.central_acessos", defaultTitle: "Gestão de Acessos", url: "/access-hub", icon: Eye, moduleKey: "access_hub",
  },
  "sidebar.pacotes_pontos": {
    key: "sidebar.pacotes_pontos", defaultTitle: "Pacotes de Pontos", url: "/points-packages", icon: Package,
  },
  "sidebar.regras_resgate": {
    key: "sidebar.regras_resgate", defaultTitle: "Regras de Resgate", url: "/regras-resgate", icon: Settings2,
  },
  "sidebar.jornada_cidades": {
    key: "sidebar.jornada_cidades", defaultTitle: "Guia de Cidades", url: "/brand-cidades-journey", icon: BookOpen,
  },
  "sidebar.onboarding_cidade": {
    key: "sidebar.onboarding_cidade", defaultTitle: "Onboarding Cidade", url: "/city-onboarding", icon: Rocket,
  },
  "sidebar.configuracao_cidade": {
    key: "sidebar.configuracao_cidade", defaultTitle: "Configuração por Cidade", url: "/configuracao-cidade", icon: Settings2,
  },
  "sidebar.dominios_marca": {
    key: "sidebar.dominios_marca", defaultTitle: "Meus Domínios", url: "/brand-domains", icon: Globe,
  },

  // ─── Personalização & Vitrine ───
  "sidebar.galeria_icones": {
    key: "sidebar.galeria_icones", defaultTitle: "Biblioteca de Ícones", url: "/icon-library", icon: Grip, moduleKey: "icon_library",
  },
  "sidebar.app_icons": {
    key: "sidebar.app_icons", defaultTitle: "Ícones do Aplicativo", url: "/app-icons", icon: AppWindow,
  },
  "sidebar.central_banners": {
    key: "sidebar.central_banners", defaultTitle: "Mídia & Banners", url: "/banner-manager", icon: GalleryHorizontal, moduleKey: "banners",
  },
  "sidebar.nomes_rotulos": {
    key: "sidebar.nomes_rotulos", defaultTitle: "Nomenclaturas", url: "/menu-labels", icon: Palette,
  },
  "sidebar.page_builder": {
    key: "sidebar.page_builder", defaultTitle: "Editor de Páginas", url: "/page-builder-v2", icon: Layers, moduleKey: "page_builder",
  },
  "sidebar.tema_plataforma": {
    key: "sidebar.tema_plataforma", defaultTitle: "Tema da Plataforma", url: "/platform-theme", icon: Settings2,
  },
  "sidebar.tema_marca": {
    key: "sidebar.tema_marca", defaultTitle: "Identidade Visual", url: "/brands", icon: Palette, moduleKey: "brand_theme",
  },
  "sidebar.welcome_tour": {
    key: "sidebar.welcome_tour", defaultTitle: "Boas-Vindas", url: "/welcome-tour", icon: Rocket, moduleKey: "welcome_tour",
  },
  "sidebar.profile_links": {
    key: "sidebar.profile_links", defaultTitle: "Links do Perfil", url: "/profile-links", icon: FileText, moduleKey: "profile_links",
  },
  "sidebar.partner_landing": {
    key: "sidebar.partner_landing", defaultTitle: "Landing Page Parceiros", url: "/partner-landing-config", icon: FileUp, moduleKey: "partner_landing",
  },
  "sidebar.offer_card_config": {
    key: "sidebar.offer_card_config", defaultTitle: "Layout de Ofertas", url: "/offer-card-config", icon: LayoutTemplate, moduleKey: "offer_card_config",
  },

  // ─── Gestão Comercial ───
  "sidebar.operador_pdv": {
    key: "sidebar.operador_pdv", defaultTitle: "Caixa PDV", url: "/pdv", icon: ScanLine, moduleKey: "earn_points_store",
  },
  "sidebar.parceiros": {
    key: "sidebar.parceiros", defaultTitle: "Parceiros", url: "/stores", icon: ShoppingBag, moduleKey: "stores",
  },
  "sidebar.ofertas": {
    key: "sidebar.ofertas", defaultTitle: "Ofertas", url: "/offers", icon: Tag, moduleKey: "offers",
  },
  "sidebar.clientes": {
    key: "sidebar.clientes", defaultTitle: "Clientes", url: "/customers", icon: UserCheck, moduleKey: "wallet",
  },
  "sidebar.resgates": {
    key: "sidebar.resgates", defaultTitle: "Resgates", url: "/redemptions", icon: ReceiptText, moduleKey: "redemption_qr",
  },
  "sidebar.cupons": {
    key: "sidebar.cupons", defaultTitle: "Cupons", url: "/vouchers", icon: Ticket, moduleKey: "vouchers",
  },
  "sidebar.patrocinados": {
    key: "sidebar.patrocinados", defaultTitle: "Patrocinados", url: "/sponsored-placements", icon: Zap, moduleKey: "sponsored",
  },
  "sidebar.motoristas": {
    key: "sidebar.motoristas", defaultTitle: "Motoristas", url: "/motoristas", icon: Truck, moduleKey: "machine_integration", scoringFilter: "DRIVER",
  },
  "sidebar.compra_pontos_motorista": {
    key: "sidebar.compra_pontos_motorista", defaultTitle: "Venda de Pontos", url: "/driver-points-purchase", icon: Coins, moduleKey: "machine_integration", scoringFilter: "DRIVER",
  },
  "sidebar.painel_motorista_view": {
    key: "sidebar.painel_motorista_view", defaultTitle: "Painel do Motorista", url: "/driver", icon: Car, scoringFilter: "DRIVER",
  },

  // ─── Achadinhos ───
  "sidebar.achadinhos": {
    key: "sidebar.achadinhos", defaultTitle: "Achadinhos", url: "/affiliate-deals", icon: ShoppingCart, moduleKey: "affiliate_deals",
  },
  "sidebar.categorias_achadinhos": {
    key: "sidebar.categorias_achadinhos", defaultTitle: "Categorias de Achadinhos", url: "/affiliate-categories", icon: FolderHeart, moduleKey: "affiliate_deals",
  },
  "sidebar.espelhamento": {
    key: "sidebar.espelhamento", defaultTitle: "Espelhamento", url: "/mirror-sync", icon: RefreshCw, moduleKey: "affiliate_deals",
  },
  "sidebar.governanca_ofertas": {
    key: "sidebar.governanca_ofertas", defaultTitle: "Governança de Ofertas", url: "/offer-governance", icon: Shield, moduleKey: "affiliate_deals",
  },

  // ─── Aprovações ───
  "sidebar.aprovar_regras": {
    key: "sidebar.aprovar_regras", defaultTitle: "Validar Regras", url: "/approve-store-rules", icon: ClipboardCheck, moduleKey: "earn_points_store",
  },
  "sidebar.solicitacoes_emissor": {
    key: "sidebar.solicitacoes_emissor", defaultTitle: "Solicitações de Upgrade", url: "/emitter-requests", icon: Zap, moduleKey: "multi_emitter",
  },
  "sidebar.catalogo": {
    key: "sidebar.catalogo", defaultTitle: "Catálogo", url: "/store-catalog", icon: PackageSearch, moduleKey: "catalog",
  },

  // ─── Comunicação ───
  "sidebar.enviar_notificacao": {
    key: "sidebar.enviar_notificacao", defaultTitle: "Enviar Notificação", url: "/send-notification", icon: Bell, moduleKey: "notifications",
  },

  // ─── Programa de Fidelidade ───
  "sidebar.pontuar": {
    key: "sidebar.pontuar", defaultTitle: "Pontuar", url: "/earn-points", icon: Coins, moduleKey: "earn_points_store",
  },
  "sidebar.regras_pontos": {
    key: "sidebar.regras_pontos", defaultTitle: "Regras de Fidelidade", url: "/points-rules", icon: Settings2, moduleKey: "earn_points_store",
  },
  "sidebar.extrato_pontos": {
    key: "sidebar.extrato_pontos", defaultTitle: "Extrato de Fidelidade", url: "/points-ledger", icon: ScrollText, moduleKey: "earn_points_store",
  },
  "sidebar.tier_pontos": {
    key: "sidebar.tier_pontos", defaultTitle: "Pontuação por Tier", url: "/tier-points-rules", icon: CreditCard, moduleKey: "earn_points_store", scoringFilter: "PASSENGER",
  },

  // ─── Motoristas & Resgate ───
  "sidebar.carteira_pontos": {
    key: "sidebar.carteira_pontos", defaultTitle: "Carteira de Pontos", url: "/branch-wallet", icon: Coins, moduleKey: "achadinhos_motorista",
  },
  "sidebar.comprar_pontos": {
    key: "sidebar.comprar_pontos", defaultTitle: "Comprar Pontos", url: "/points-packages-store", icon: ShoppingCart, moduleKey: "achadinhos_motorista",
  },
  "sidebar.produtos_resgate": {
    key: "sidebar.produtos_resgate", defaultTitle: "Produtos de Resgate", url: "/produtos-resgate", icon: ShoppingBag, scoringFilter: "DRIVER",
  },
  "sidebar.pedidos_resgate": {
    key: "sidebar.pedidos_resgate", defaultTitle: "Pedidos de Resgate", url: "/product-redemption-orders", icon: ReceiptText, scoringFilter: "DRIVER",
  },
  "sidebar.relatorios_cidade": {
    key: "sidebar.relatorios_cidade", defaultTitle: "Relatórios", url: "/branch-reports", icon: BarChart3, moduleKey: "achadinhos_motorista",
  },

  // ─── Gamificação ───
  "sidebar.gamificacao": {
    key: "sidebar.gamificacao", defaultTitle: "Duelos & Ranking", url: "/gamificacao-admin", icon: Swords, moduleKey: "achadinhos_motorista", scoringFilter: "DRIVER",
  },

  // ─── Cashback Inteligente ───
  "sidebar.gg_dashboard": {
    key: "sidebar.gg_dashboard", defaultTitle: "Painel Cashback", url: "/ganha-ganha-dashboard", icon: Handshake,
  },
  "sidebar.gg_config": {
    key: "sidebar.gg_config", defaultTitle: "Config. Cashback", url: "/ganha-ganha-config", icon: Settings2, moduleKey: "ganha_ganha",
  },
  "sidebar.gg_billing": {
    key: "sidebar.gg_billing", defaultTitle: "Financeiro Cashback", url: "/ganha-ganha-billing", icon: ReceiptText, moduleKey: "ganha_ganha",
  },
  "sidebar.gg_closing": {
    key: "sidebar.gg_closing", defaultTitle: "Fechamento Financeiro", url: "/ganha-ganha-closing", icon: ScrollText, moduleKey: "ganha_ganha",
  },
  "sidebar.gg_store_summary": {
    key: "sidebar.gg_store_summary", defaultTitle: "Resumo por Parceiro", url: "/ganha-ganha-store-summary", icon: Handshake,
  },

  // ─── Equipe & Acessos ───
  "sidebar.usuarios": {
    key: "sidebar.usuarios", defaultTitle: "Usuários", url: "/users", icon: Users, moduleKey: "users_management",
  },
  "sidebar.perm_parceiros": {
    key: "sidebar.perm_parceiros", defaultTitle: "Permissão de Parceiros", url: "/brand-permissions", icon: ShieldCheck, moduleKey: "store_permissions",
  },

  // ─── Inteligência & Dados ───
  "sidebar.crm": {
    key: "sidebar.crm", defaultTitle: "Inteligência CRM", url: "/crm", icon: TrendingUp, moduleKey: "crm",
  },
  "sidebar.relatorios": {
    key: "sidebar.relatorios", defaultTitle: "Relatórios", url: "/reports", icon: BarChart3, moduleKey: "reports",
  },
  "sidebar.auditoria": {
    key: "sidebar.auditoria", defaultTitle: "Auditoria", url: "/audit", icon: ClipboardList, moduleKey: "audit",
  },
  "sidebar.importar_csv": {
    key: "sidebar.importar_csv", defaultTitle: "Importação de Dados", url: "/csv-import", icon: FileSpreadsheet, moduleKey: "stores",
  },
  "sidebar.taxonomia": {
    key: "sidebar.taxonomia", defaultTitle: "Taxonomia", url: "/taxonomy", icon: FolderTree, moduleKey: "taxonomy",
  },

  // ─── Integrações & API ───
  "sidebar.api_keys": {
    key: "sidebar.api_keys", defaultTitle: "APIs & Integrações", url: "/api-keys", icon: Key, moduleKey: "api_keys",
  },
  "sidebar.api_docs": {
    key: "sidebar.api_docs", defaultTitle: "Documentação API", url: "/api-docs", icon: BookOpen, moduleKey: "api_keys",
  },
  "sidebar.machine": {
    key: "sidebar.machine", defaultTitle: "Integração Mobilidade", url: "/machine-integration", icon: Car, moduleKey: "machine_integration",
  },
  "sidebar.teste_webhook": {
    key: "sidebar.teste_webhook", defaultTitle: "Lab Webhook", url: "/machine-webhook-test", icon: FlaskConical, moduleKey: "machine_integration",
  },
  "sidebar.api_journey": {
    key: "sidebar.api_journey", defaultTitle: "Guia da API", url: "/brand-api-journey", icon: BookOpen, moduleKey: "machine_integration",
  },

  // ─── Configurações ───
  "sidebar.funcionalidades": {
    key: "sidebar.funcionalidades", defaultTitle: "Tipos de Módulo", url: "/modules", icon: Blocks,
  },
  "sidebar.modulos": {
    key: "sidebar.modulos", defaultTitle: "Módulos", url: "/brand-modules", icon: Blocks,
  },
  "sidebar.permissoes_globais": {
    key: "sidebar.permissoes_globais", defaultTitle: "Políticas de Acesso", url: "/permissions", icon: Shield,
  },
  "sidebar.secoes_home": {
    key: "sidebar.secoes_home", defaultTitle: "Seções Iniciais", url: "/templates", icon: Layout,
  },
  "sidebar.modelos_home": {
    key: "sidebar.modelos_home", defaultTitle: "Templates", url: "/home-templates", icon: LayoutList,
  },
  "sidebar.controle_recursos": {
    key: "sidebar.controle_recursos", defaultTitle: "Feature Flags", url: "/flags", icon: Flag,
  },
  "sidebar.atualizacoes": {
    key: "sidebar.atualizacoes", defaultTitle: "Novidades", url: "/releases", icon: Rocket,
  },
  "sidebar.kit_inicial": {
    key: "sidebar.kit_inicial", defaultTitle: "Starter Kit", url: "/starter-kit", icon: PackageSearch,
  },
  "sidebar.configuracoes": {
    key: "sidebar.configuracoes", defaultTitle: "Configurações", url: "/brand-settings", icon: Settings2, moduleKey: "brand_settings",
  },
  "sidebar.subscription": {
    key: "sidebar.subscription", defaultTitle: "Assinatura", url: "/subscription", icon: CreditCard, moduleKey: "subscription",
  },
  "sidebar.plan_templates": {
    key: "sidebar.plan_templates", defaultTitle: "Perfil de Planos", url: "/plan-templates", icon: LayoutList,
  },
  "sidebar.plan_pricing": {
    key: "sidebar.plan_pricing", defaultTitle: "Preços dos Planos", url: "/plan-pricing", icon: DollarSign,
  },
};

// ─── Tipagem para definição de grupo de sidebar ───

export interface DefinicaoItemGrupo {
  key: string;
  /** Sobrescrita local de propriedades do registro (ex: moduleKey diferente, scoringFilter) */
  overrides?: Partial<Omit<RegistroItemMenu, "key">>;
}

export interface DefinicaoGrupoSidebar {
  label: string;
  items: (string | DefinicaoItemGrupo)[];
  /** Filtros específicos do sidebar de cidade */
  scoringFilter?: "DRIVER" | "PASSENGER";
  branchModuleKey?: string;
}

/**
 * Monta os grupos finais a partir das definições locais + registro central.
 * Itens não encontrados no registro são ignorados silenciosamente.
 */
export function buildSidebarGroups(
  groupDefs: DefinicaoGrupoSidebar[]
): {
  label: string;
  items: RegistroItemMenu[];
  scoringFilter?: "DRIVER" | "PASSENGER";
  branchModuleKey?: string;
}[] {
  return groupDefs.map((group) => ({
    label: group.label,
    scoringFilter: group.scoringFilter,
    branchModuleKey: group.branchModuleKey,
    items: group.items
      .map((entry) => {
        const key = typeof entry === "string" ? entry : entry.key;
        const overrides = typeof entry === "string" ? undefined : entry.overrides;
        const base = MENU_REGISTRY[key];
        if (!base) return null;
        return overrides ? { ...base, ...overrides, key } : base;
      })
      .filter(Boolean) as RegistroItemMenu[],
  }));
}
