/**
 * Mapa centralizado de páginas lazy-loaded. Importar daqui em App.tsx (e
 * em route-blocks) evita inflar o entrypoint principal e mantém um único
 * lugar para registrar/renomear páginas.
 */
import { lazyWithRetry } from "@/lib/lazyWithRetry";

export const AppLayout = lazyWithRetry(() => import("@/components/AppLayout"));
export const WhiteLabelLayout = lazyWithRetry(() => import("@/components/WhiteLabelLayout"));
export const NotFound = lazyWithRetry(() => import("@/pages/NotFound"));

// Journey/guide
export const RootJourneyGuidePage = lazyWithRetry(() => import("@/pages/RootJourneyGuidePage"));
export const BrandJourneyGuidePage = lazyWithRetry(() => import("@/pages/BrandJourneyGuidePage"));
export const EmitterJourneyGuidePage = lazyWithRetry(() => import("@/pages/EmitterJourneyGuidePage"));

// Features (PT)
export const PaginaAdminOrigens = lazyWithRetry(() => import("@/features/admin_origens/pagina_admin_origens"));
export const PaginaDiagnosticoMarca = lazyWithRetry(() => import("@/features/diagnostico_marca/pagina_diagnostico_marca"));
export const PaginaConfigurarGanhaGanha = lazyWithRetry(() => import("@/features/painel_modelos_negocio/pagina_configurar_ganha_ganha"));
export const PaginaModelosPorCidadeBranch = lazyWithRetry(() => import("@/features/painel_modelos_negocio/pagina_modelos_por_cidade_branch"));
export const PaginaLinks = lazyWithRetry(() => import("@/features/pagina_links/pagina_links"));
export const PaginaHallDaFama = lazyWithRetry(() => import("@/features/hall_da_fama/pagina_hall_da_fama"));
export const PaginaProdutosComerciais = lazyWithRetry(() => import("@/features/produtos_comerciais/pagina_produtos_comerciais"));
export const PaginaAuditoriaDuplicacoes = lazyWithRetry(() => import("@/features/auditoria_duplicacoes/pagina_auditoria_duplicacoes"));
export const PaginaLandingProduto = lazyWithRetry(() => import("@/features/landing_produto/pagina_landing_produto"));
export const PaginaCatalogoProdutos = lazyWithRetry(() => import("@/features/catalogo_produtos/pagina_catalogo_produtos"));
export const PaginaAgendarDemonstracao = lazyWithRetry(() => import("@/features/agendar_demonstracao/pagina_agendar_demonstracao"));
export const PaginaLeadsComerciais = lazyWithRetry(() => import("@/features/leads_comerciais/pagina_leads_comerciais"));
export const PaginaDetalhesLead = lazyWithRetry(() => import("@/features/leads_comerciais/pagina_detalhes_lead"));
export const PaginaRelatorioCorridas = lazyWithRetry(() => import("@/features/relatorio_corridas/pagina_relatorio_corridas"));
export const PaginaCentralModulos = lazyWithRetry(() => import("@/features/central_modulos/pagina_central_modulos"));
export const PaginaOnboardingCidade = lazyWithRetry(() => import("@/features/city_onboarding/pagina_onboarding_cidade"));
export const PaginaConfiguracaoCidade = lazyWithRetry(() => import("@/features/configuracao_cidade/pagina_configuracao_cidade"));
export const PaginaConfiguracaoModulosCidade = lazyWithRetry(() => import("@/features/configuracao_modulos_cidade/pagina_configuracao_modulos_cidade"));
export const PaginaPacotesPontos = lazyWithRetry(() => import("@/features/pacotes_pontos/pagina_pacotes_pontos"));
export const PaginaLojaPacotes = lazyWithRetry(() => import("@/features/pacotes_pontos/pagina_loja_pacotes"));
export const PaginaLojaPublica = lazyWithRetry(() => import("@/features/loja_publica/pagina_loja_publica"));
export const PaginaUbizOfertas = lazyWithRetry(() => import("@/features/ubiz_ofertas/pagina_ubiz_ofertas"));
export const PaginaAdminUbizOfertas = lazyWithRetry(() => import("@/features/ubiz_ofertas_admin/pagina_admin_ubiz_ofertas"));
export const DriverPointsPurchaseConfigPage = lazyWithRetry(() => import("@/features/compra_pontos_motorista/pagina_compra_pontos_config"));
export const PaginaConversaoResgate = lazyWithRetry(() => import("@/pages/conversao_resgate/pagina_conversao_resgate"));

// Pages — auth
export const Auth = lazyWithRetry(() => import("@/pages/Auth"));
export const ResetPassword = lazyWithRetry(() => import("@/pages/ResetPassword"));

// Pages — core
export const Dashboard = lazyWithRetry(() => import("@/pages/Dashboard"));
export const Tenants = lazyWithRetry(() => import("@/pages/Tenants"));
export const TenantForm = lazyWithRetry(() => import("@/pages/TenantForm"));
export const Brands = lazyWithRetry(() => import("@/pages/Brands"));
export const BrandForm = lazyWithRetry(() => import("@/pages/BrandForm"));
export const Branches = lazyWithRetry(() => import("@/pages/Branches"));
export const BranchForm = lazyWithRetry(() => import("@/pages/BranchForm"));
export const BrandDomains = lazyWithRetry(() => import("@/pages/BrandDomains"));
export const PaginaDominiosMarca = lazyWithRetry(() => import("@/pages/PaginaDominiosMarca"));
export const UsersPage = lazyWithRetry(() => import("@/pages/UsersPage"));
export const StoresPage = lazyWithRetry(() => import("@/pages/StoresPage"));
export const OffersPage = lazyWithRetry(() => import("@/pages/OffersPage"));
export const CustomersPage = lazyWithRetry(() => import("@/pages/CustomersPage"));
export const RedemptionsPage = lazyWithRetry(() => import("@/pages/RedemptionsPage"));
export const SectionTemplatesPage = lazyWithRetry(() => import("@/pages/SectionTemplatesPage"));
export const ModuleDefinitionsPage = lazyWithRetry(() => import("@/pages/ModuleDefinitionsPage"));
export const FeatureFlagsPage = lazyWithRetry(() => import("@/pages/FeatureFlagsPage"));
export const PermissionsPage = lazyWithRetry(() => import("@/pages/PermissionsPage"));
export const AuditLogsPage = lazyWithRetry(() => import("@/pages/AuditLogsPage"));
export const ReleasesPage = lazyWithRetry(() => import("@/pages/ReleasesPage"));
export const HomeTemplatesPage = lazyWithRetry(() => import("@/pages/HomeTemplatesPage"));
export const CsvImportPage = lazyWithRetry(() => import("@/pages/CsvImportPage"));
export const CloneBranchPage = lazyWithRetry(() => import("@/pages/CloneBranchPage"));
export const BrandModulesPage = lazyWithRetry(() => import("@/pages/BrandModulesPage"));

// Vouchers/redemption
export const Vouchers = lazyWithRetry(() => import("@/pages/Vouchers"));
export const VoucherForm = lazyWithRetry(() => import("@/pages/VoucherForm"));
export const VoucherWizardPage = lazyWithRetry(() => import("@/pages/VoucherWizardPage"));
export const VoucherRedeem = lazyWithRetry(() => import("@/pages/VoucherRedeem"));
export const OperatorRedeemPage = lazyWithRetry(() => import("@/pages/OperatorRedeemPage"));

// Pontos
export const PointsRulesPage = lazyWithRetry(() => import("@/pages/PointsRulesPage"));
export const EarnPointsPage = lazyWithRetry(() => import("@/pages/EarnPointsPage"));
export const PointsLedgerPage = lazyWithRetry(() => import("@/pages/PointsLedgerPage"));
export const StorePointsRulePage = lazyWithRetry(() => import("@/pages/StorePointsRulePage"));
export const ApproveStoreRulesPage = lazyWithRetry(() => import("@/pages/ApproveStoreRulesPage"));
export const TierPointsRulesPage = lazyWithRetry(() => import("@/pages/TierPointsRulesPage"));
export const DriverPointsRulesPage = lazyWithRetry(() => import("@/pages/DriverPointsRulesPage"));

// Customer/preview
export const CustomerPreviewPage = lazyWithRetry(() => import("@/pages/CustomerPreviewPage"));
export const StoreRegistrationWizard = lazyWithRetry(() => import("@/pages/StoreRegistrationWizard"));

// Store owner
export const StoreOwnerPanel = lazyWithRetry(() => import("@/pages/StoreOwnerPanel"));

// Affiliate / catalog
export const AffiliateDealsPage = lazyWithRetry(() => import("@/pages/AffiliateDealsPage"));
export const AffiliateCategoriesPage = lazyWithRetry(() => import("@/pages/AffiliateCategoriesPage"));
export const StoreCatalogPage = lazyWithRetry(() => import("@/pages/StoreCatalogPage"));
export const AchadinhosMobileImportPage = lazyWithRetry(() => import("@/pages/AchadinhosMobileImportPage"));
export const MirrorSyncPage = lazyWithRetry(() => import("@/pages/MirrorSyncPage"));
export const OfferGovernancePage = lazyWithRetry(() => import("@/pages/OfferGovernancePage"));
export const ProductRedemptionOrdersPage = lazyWithRetry(() => import("@/pages/ProductRedemptionOrdersPage"));
export const ProdutosResgatePage = lazyWithRetry(() => import("@/pages/ProdutosResgatePage"));
export const RegrasResgatePage = lazyWithRetry(() => import("@/pages/RegrasResgatePage"));

// Reports
export const ReportsPage = lazyWithRetry(() => import("@/pages/ReportsPage"));

// Banners / page builder
export const SendNotificationPage = lazyWithRetry(() => import("@/pages/SendNotificationPage"));
export const IconLibraryPage = lazyWithRetry(() => import("@/pages/IconLibraryPage"));
export const BannerManagerPage = lazyWithRetry(() => import("@/pages/BannerManagerPage"));
export const MenuLabelsPage = lazyWithRetry(() => import("@/pages/MenuLabelsPage"));
export const PageBuilderPage = lazyWithRetry(() => import("@/pages/PageBuilderPage"));
export const PageBuilderV2Page = lazyWithRetry(() => import("@/pages/PageBuilderV2Page"));

// Brand provision / config
export const ProvisionBrandWizard = lazyWithRetry(() => import("@/pages/ProvisionBrandWizard"));
export const BrandPermissionOverflowPage = lazyWithRetry(() => import("@/pages/BrandPermissionOverflowPage"));
export const StarterKitConfigPage = lazyWithRetry(() => import("@/pages/StarterKitConfigPage"));
export const EmitterRequestsPage = lazyWithRetry(() => import("@/pages/EmitterRequestsPage"));
export const PlatformThemePage = lazyWithRetry(() => import("@/pages/PlatformThemePage"));
export const AppIconsConfigPage = lazyWithRetry(() => import("@/pages/AppIconsConfigPage"));
export const WelcomeTourConfigPage = lazyWithRetry(() => import("@/pages/WelcomeTourConfigPage"));
export const ProfileLinksConfigPage = lazyWithRetry(() => import("@/pages/ProfileLinksConfigPage"));

// Ganha-Ganha
export const GanhaGanhaConfigPage = lazyWithRetry(() => import("@/pages/GanhaGanhaConfigPage"));
export const GanhaGanhaBillingPage = lazyWithRetry(() => import("@/pages/GanhaGanhaBillingPage"));
export const GanhaGanhaRootDashboardPage = lazyWithRetry(() => import("@/pages/GanhaGanhaRootDashboardPage"));
export const GanhaGanhaClosingReportsPage = lazyWithRetry(() => import("@/pages/GanhaGanhaClosingReportsPage"));
export const GanhaGanhaStoreSummaryPage = lazyWithRetry(() => import("@/pages/GanhaGanhaStoreSummaryPage"));
export const GanhaGanhaReportsPage = lazyWithRetry(() => import("@/pages/GanhaGanhaReportsPage"));
export const StoreGanhaGanhaPage = lazyWithRetry(() => import("@/pages/StoreGanhaGanhaPage"));

// API
export const BrandApiKeysPage = lazyWithRetry(() => import("@/pages/BrandApiKeysPage"));
export const ApiDocsPage = lazyWithRetry(() => import("@/pages/ApiDocsPage"));
export const BrandApiJourneyPage = lazyWithRetry(() => import("@/pages/BrandApiJourneyPage"));

// Trial / subscription / settings
export const TrialSignupPage = lazyWithRetry(() => import("@/pages/TrialSignupPage"));
export const SubscriptionPage = lazyWithRetry(() => import("@/pages/SubscriptionPage"));
export const BrandSettingsPage = lazyWithRetry(() => import("@/pages/BrandSettingsPage"));
export const SponsoredPlacementsPage = lazyWithRetry(() => import("@/pages/SponsoredPlacementsPage"));
export const MachineIntegrationPage = lazyWithRetry(() => import("@/pages/MachineIntegrationPage"));
export const MachineWebhookTestPage = lazyWithRetry(() => import("@/pages/MachineWebhookTestPage"));
export const OfferCardConfigPage = lazyWithRetry(() => import("@/pages/OfferCardConfigPage"));
export const PlanModuleTemplatesPage = lazyWithRetry(() => import("@/pages/PlanModuleTemplatesPage"));

// Drivers
export const DriverManagementPage = lazyWithRetry(() => import("@/pages/DriverManagementPage"));
export const BranchWalletPage = lazyWithRetry(() => import("@/pages/BranchWalletPage"));
export const BranchReportsPage = lazyWithRetry(() => import("@/pages/BranchReportsPage"));
export const DriverPanelConfigPage = lazyWithRetry(() => import("@/pages/DriverPanelConfigPage"));
export const DriverPanelPage = lazyWithRetry(() => import("@/pages/DriverPanelPage"));

// Taxonomy / custom pages
export const TaxonomyPage = lazyWithRetry(() => import("@/pages/TaxonomyPage"));
export const CustomPage = lazyWithRetry(() => import("@/pages/customer/CustomPage"));
export const WebviewPage = lazyWithRetry(() => import("@/pages/customer/WebviewPage"));
export const PublicVouchers = lazyWithRetry(() => import("@/pages/PublicVouchers"));

// Landing
export const LandingPage = lazyWithRetry(() => import("@/pages/LandingPage"));
export const PartnerLandingPage = lazyWithRetry(() => import("@/pages/PartnerLandingPage"));
export const PartnerLandingConfigPage = lazyWithRetry(() => import("@/pages/PartnerLandingConfigPage"));
export const AccessHubPage = lazyWithRetry(() => import("@/pages/AccessHubPage"));
export const CrmEmbedPage = lazyWithRetry(() => import("@/pages/CrmEmbedPage"));

// Campeonato
export const RotaCampeonatoMotorista = lazyWithRetry(
  () => import("@/products/campeonato/pages/rota_campeonato_motorista"),
);
export const PaginaCampeonatoStandalone = lazyWithRetry(
  () => import("@/products/campeonato/pages/pagina_campeonato_standalone"),
);

// MCP / misc
export const McpDashboardPage = lazyWithRetry(() => import("@/pages/McpDashboardPage"));
export const GamificacaoAdminPage = lazyWithRetry(() => import("@/pages/GamificacaoAdminPage"));
export const ManuaisPage = lazyWithRetry(() => import("@/pages/ManuaisPage"));
export const BrandBranchesPage = lazyWithRetry(() => import("@/pages/BrandBranchesPage"));
export const BrandBranchForm = lazyWithRetry(() => import("@/pages/BrandBranchForm"));
export const BrandCidadesJourneyPage = lazyWithRetry(() => import("@/pages/BrandCidadesJourneyPage"));
export const InstallPwaPage = lazyWithRetry(() => import("@/pages/InstallPwaPage"));
