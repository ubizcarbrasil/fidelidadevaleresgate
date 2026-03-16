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
  crm: {
    ...createKeys("crm"),
    contacts: createKeys("crm-contacts"),
    events: createKeys("crm-events"),
    audiences: createKeys("crm-audiences"),
    campaigns: createKeys("crm-campaigns"),
    tiers: createKeys("crm-tiers"),
  },
  loyalty: {
    ...createKeys("loyalty"),
    earnings: createKeys("loyalty-earnings"),
    rules: createKeys("loyalty-rules"),
    ledger: createKeys("loyalty-ledger"),
  },
  vouchers: createKeys("vouchers"),
  customers: createKeys("customers"),
  stores: createKeys("stores"),
  offers: createKeys("offers"),
  brands: createKeys("brands"),
  branches: createKeys("branches"),
  dashboard: createKeys("dashboard"),
  permissionGroups: createKeys("permission-groups"),
  permissionSubgroups: createKeys("permission-subgroups"),
  permissionConfig: createKeys("permission-config"),
} as const;
