/**
 * Query Key Factory — chaves tipadas por módulo para invalidação precisa.
 *
 * Uso:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.crm.contacts._def })
 *   useQuery({ queryKey: queryKeys.loyalty.earnings.list(brandId, period) })
 */

function createKeys<T extends string>(module: T) {
  return {
    all: [module] as const,
    lists: () => [module, "list"] as const,
    list: (...args: unknown[]) => [module, "list", ...args] as const,
    details: () => [module, "detail"] as const,
    detail: (id: string) => [module, "detail", id] as const,
    stats: (...args: unknown[]) => [module, "stats", ...args] as const,
  };
}

export const queryKeys = {
  // ── CRM ──
  crm: {
    ...createKeys("crm"),
    contacts: createKeys("crm-contacts"),
    events: createKeys("crm-events"),
    audiences: createKeys("crm-audiences"),
    campaigns: createKeys("crm-campaigns"),
    tiers: createKeys("crm-tiers"),
  },

  // ── Loyalty ──
  loyalty: {
    ...createKeys("loyalty"),
    earnings: createKeys("loyalty-earnings"),
    rules: createKeys("loyalty-rules"),
    ledger: createKeys("loyalty-ledger"),
  },

  // ── Core entities ──
  vouchers: createKeys("vouchers"),
  customers: createKeys("customers"),
  stores: createKeys("stores"),
  offers: createKeys("offers"),
  brands: createKeys("brands"),
  branches: createKeys("branches"),
  redemptions: createKeys("redemptions"),
  coupons: createKeys("coupons"),
  dashboard: createKeys("dashboard"),

  // ── Permissions ──
  permissionGroups: createKeys("permission-groups"),
  permissionSubgroups: createKeys("permission-subgroups"),
  permissionConfig: createKeys("permission-config"),
  permissionSubItems: createKeys("permission-sub-items"),
  brandSubPermConfig: createKeys("brand-sub-perm-config"),

  // ── Customer-facing ──
  customerRedemptions: createKeys("customer-redemptions"),
  customerWallet: {
    ...createKeys("customer-wallet"),
    ledger: (...args: unknown[]) => ["customer-wallet-ledger", ...args] as const,
    count: (...args: unknown[]) => ["customer-wallet-count", ...args] as const,
  },
  customerFavorites: createKeys("customer-favorites"),
  customerLedger: createKeys("customer-ledger"),

  // ── Brand config ──
  brandSettings: createKeys("brand-settings"),
  brandDetail: createKeys("brand-detail"),
  brandTeam: createKeys("brand-team"),
  brandModules: createKeys("brand-modules"),
  brandModulesActive: createKeys("brand-modules-active"),
  brandDomains: createKeys("brand-domains"),
  brandTrial: createKeys("brand-trial-status"),
  brandScoringModels: createKeys("brand-scoring-models"),

  // ── Affiliate / Achadinhos ──
  affiliateDeals: createKeys("affiliate-deals"),
  affiliateCategories: createKeys("affiliate-categories"),
  affiliateCatBanners: createKeys("affiliate-cat-banners"),
  affiliateCatBannersAdmin: createKeys("affiliate-cat-banners-admin"),

  // ── Drivers ──
  driverManagement: createKeys("driver-management"),
  driverLedger: createKeys("driver-ledger"),
  driverLedgerMachine: createKeys("driver-ledger-machine"),
  driverLedgerDetail: createKeys("driver-ledger-detail"),
  driverRuleIndividual: createKeys("driver-rule-individual"),
  driverRuleBrand: createKeys("driver-rule-brand"),
  driverPointsRules: createKeys("driver-points-rules"),
  driverNotificationConfig: createKeys("driver-notification-config"),
  driverRedeemOrders: createKeys("driver-redeem-orders"),
  driverCityOffers: createKeys("driver-city-offers"),
  driverPointsPerReal: createKeys("driver-points-per-real"),

  // ── Admin selects ──
  brandsSelect: createKeys("brands-select"),
  branchesSelect: createKeys("branches-select"),
  storesSelect: createKeys("stores-select"),

  // ── Misc ──
  iconLibrary: createKeys("icon-library"),
  moduleDefinitions: createKeys("module-definitions"),
  tierPointsRules: createKeys("tier-points-rules"),
  importJobs: createKeys("import-jobs-history"),
  demoStores: createKeys("demo-stores-info"),
  demoDeals: createKeys("demo-deals-info"),
  produtosResgate: createKeys("produtos-resgate"),
  produtosResgateKpis: createKeys("produtos-resgate-kpis"),
  scoredDrivers: createKeys("scored-drivers"),
} as const;
