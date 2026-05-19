import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "./AuthContext";
import { getCurrentPosition, distanceKm, type Coords } from "@/lib/geolocation";
import { useBrandTheme, type BrandTheme } from "@/hooks/useBrandTheme";
import { setBootPhase } from "@/lib/bootState";
import { getBootContext } from "@/lib/bootContext";
import { bootMark } from "@/lib/bootMetrics";

type Brand = Tables<"brands">;
type Branch = Tables<"branches">;

interface BrandContextType {
  brand: Brand | null;
  branches: Branch[];
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch) => void;
  loading: boolean;
  isWhiteLabel: boolean;
  theme: BrandTheme | null;
  detectBranchByLocation: () => Promise<Branch | null>;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

/**
 * Resolve brand by subdomain: {brandSlug}.valeresgate.com
 * or by full domain match in brand_domains table.
 */
/**
 * Detecta erros transientes de rede do Safari iOS quando 5G/WiFi oscila.
 * Sem retry, o usuário fica preso em "Carregando seu painel..." indefinidamente.
 */
function isTransientNetworkError(err: unknown): boolean {
  const msg = (err as { message?: string })?.message ?? "";
  return msg.includes("Load failed") || msg.includes("Failed to fetch") || msg.includes("NetworkError");
}

async function withNetworkRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isTransientNetworkError(err) || attempt === maxAttempts - 1) throw err;
      const delayMs = 500 * Math.pow(2, attempt); // 500ms, 1s, 2s
      console.warn(`[BrandContext] transient network error (attempt ${attempt + 1}/${maxAttempts}), retrying in ${delayMs}ms`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

/**
 * Fetch brand data by ID using the public-safe view first (works for anon),
 * falling back to the full brands table (works for authenticated users).
 */
async function fetchBrandById(brandId: string): Promise<Brand | null> {
  // FAST PATH: tenta cache do boot context (1 RPC unificada já trouxe a brand).
  // Se hit, evita 1 round-trip ao Supabase no caminho crítico do boot.
  try {
    const boot = await getBootContext();
    if (boot?.brand && boot.brand.id === brandId) {
      bootMark("brand:from-cache");
      return boot.brand as unknown as Brand;
    }
  } catch {
    /* cache miss — segue pro caminho normal */
  }

  // Try public view first (accessible to anonymous users)
  const { data: publicBrand } = await withNetworkRetry(async () => {
    const result = await supabase
      .from("public_brands_safe")
      .select("*")
      .eq("id", brandId)
      .single();
    if (result.error && isTransientNetworkError(result.error)) throw result.error;
    return result;
  });

  if (publicBrand) {
    bootMark("brand:from-public-view");
    // Cast — the public view has the same core fields
    return publicBrand as unknown as Brand;
  }

  // Fallback for authenticated users with RLS access
  const { data: brand } = await withNetworkRetry(async () => {
    const result = await supabase
      .from("brands")
      .select("*")
      .eq("id", brandId)
      .single();
    if (result.error && isTransientNetworkError(result.error)) throw result.error;
    return result;
  });

  bootMark("brand:from-brands-table");
  return brand;
}

async function resolveBrandByDomain(hostname: string): Promise<Brand | null> {
  // Sanitize hostname: remove protocol, trailing slash, lowercase
  hostname = hostname.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase().trim();

  // 1) Try subdomain match first
  const parts = hostname.split(".");
  if (parts.length >= 2) {
    const subdomain = parts[0];
    // Skip "root", "www", "app" subdomains
    if (!["root", "www", "app", "localhost"].includes(subdomain)) {
      const { data: subdomainMatch } = await supabase
        .from("brand_domains")
        .select("brand_id")
        .eq("subdomain", subdomain)
        .eq("is_active", true)
        .maybeSingle();

      if (subdomainMatch) {
        return fetchBrandById(subdomainMatch.brand_id);
      }
    }
  }

  // 2) Fallback: full domain match (try with and without www)
  const domainsToTry = [hostname];
  if (hostname.startsWith("www.")) {
    domainsToTry.push(hostname.replace("www.", ""));
  } else {
    domainsToTry.push(`www.${hostname}`);
  }

  // Paralelizar as queries de domínio (eram sequenciais — 2x RTT no 5G).
  // Em hostname com "www.", isso transforma 2x latência (300ms) em 1x.
  const domainResults = await Promise.all(
    domainsToTry.map((domain) =>
      withNetworkRetry(async () => {
        const result = await supabase
          .from("brand_domains")
          .select("brand_id")
          .eq("domain", domain)
          .eq("is_active", true)
          .maybeSingle();
        if (result.error && isTransientNetworkError(result.error)) throw result.error;
        return result;
      }).catch(() => ({ data: null })),
    ),
  );

  for (const { data } of domainResults) {
    if (data) {
      return fetchBrandById(data.brand_id);
    }
  }

  return null;
}

// Detecção síncrona executada uma única vez no carregamento do módulo.
// Permite inicializar `loading` como `false` em domínios sem resolução por
// hostname (preview, portal universal, localhost), evitando 1 render extra
// com a tela de carregamento piscando no boot rápido.
const PORTAL_HOSTNAMES_SYNC = ["app.valeresgate.com.br"];
const IS_LOCAL_HOST_SYNC = (() => {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost"
    || h.includes("lovable.app")
    || h.includes("lovableproject.com")
    || h.startsWith("root.")
    || PORTAL_HOSTNAMES_SYNC.includes(h);
})();
const HAS_BRAND_ID_PARAM_SYNC = typeof window !== "undefined"
  && new URLSearchParams(window.location.search).has("brandId");

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const { user, roles } = useAuth();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranchState] = useState<Branch | null>(null);
  // Em domínios locais/portal sem ?brandId=, já inicia `false` — evita o
  // flash do loader no boot rápido (caminho mais comum em desenvolvimento
  // e no portal universal logado).
  const [loading, setLoading] = useState(!(IS_LOCAL_HOST_SYNC && !HAS_BRAND_ID_PARAM_SYNC));
  const [isWhiteLabel, setIsWhiteLabel] = useState(false);

  const isCustomerPath = window.location.pathname.startsWith('/c/') || window.location.pathname.startsWith('/customer-preview');
  const theme = useBrandTheme(isCustomerPath ? brand?.brand_settings_json : null);

  useEffect(() => {
    const resolve = async () => {
      const hostname = window.location.hostname;
      const params = new URLSearchParams(window.location.search);
      const brandIdParam = params.get("brandId");

      // Detecta domínios que NÃO resolvem brand por hostname (portal universal,
      // preview, localhost, root). Nesses casos, pulamos a fase BRAND_LOADING
      // por completo e marcamos BRAND_READY no mesmo tick — sem texto extra
      // piscando no loader e sem ciclo de render desnecessário.
      const PORTAL_HOSTNAMES = ["app.valeresgate.com.br"];
      const isLocal = hostname === "localhost"
        || hostname.includes("lovable.app")
        || hostname.includes("lovableproject.com")
        || hostname.startsWith("root.")
        || PORTAL_HOSTNAMES.includes(hostname);

      // Caminho rápido: domínio sem resolução por hostname E sem ?brandId=
      // → libera o boot imediatamente, sem entrar em BRAND_LOADING.
      if (isLocal && !brandIdParam) {
        setLoading(false);
        setBootPhase("BRAND_READY", "skip-local");
        return;
      }

      // Safety timeout reduzido: 800ms é suficiente porque o caminho lento
      // é apenas a query a brand_domains (1 SELECT indexado).
      const safetyTimeout = setTimeout(() => {
        setLoading(false);
        setBootPhase("BRAND_READY", "timeout");
      }, 800);

      setBootPhase("BRAND_LOADING");
      try {
        // 1) Check for ?brandId= URL parameter on ANY domain (root admin impersonation)
        if (brandIdParam) {
          const brandData = await fetchBrandById(brandIdParam);
          if (brandData) {
            setBrand(brandData);
          }
          return;
        }

        setIsWhiteLabel(true);
        const resolved = await resolveBrandByDomain(hostname);
        setBrand(resolved);
      } catch (err) {
        console.error("BrandContext resolve error:", err);
      } finally {
        clearTimeout(safetyTimeout);
        setLoading(false);
        setBootPhase("BRAND_READY");
      }
    };
    resolve();
  }, []);

  // Load branches and restore profile in parallel when brand is resolved
  useEffect(() => {
    if (!brand) return;
    const load = async () => {
      const branchesPromise = supabase
        .from("branches")
        .select("*")
        .eq("brand_id", brand.id)
        .eq("is_active", true)
        .order("name");

      const profilePromise = user
        ? supabase.from("profiles").select("selected_branch_id").eq("id", user.id).single()
        : Promise.resolve({ data: null });

      const [branchesResult, profileResult] = await Promise.all([branchesPromise, profilePromise]);

      const branchList = branchesResult.data || [];
      setBranches(branchList);

      if (branchList.length === 1) {
        setSelectedBranchState(branchList[0]);
      } else if (profileResult.data?.selected_branch_id && branchList.length > 1) {
        const saved = branchList.find((b) => b.id === profileResult.data!.selected_branch_id);
        if (saved) setSelectedBranchState(saved);
      }
    };
    load();
  }, [brand, user]);

  // Portal universal (app.valeresgate.com.br): sem domain match, resolve o brand
  // a partir dos roles que o AuthContext já carregou — evita um SELECT extra
  // em user_roles no caminho crítico do login.
  //
  // Também precisa re-resolver quando o usuário troca (logout + login na
  // mesma aba) para evitar vazamento da identidade visual do tenant
  // anterior (logo, cores, favicon, manifest). Não confiamos só em
  // `brand === null`: comparamos `user.id` com o último resolvido.
  const lastResolvedUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (loading) return;

    // Logout: limpa toda a identidade da marca anterior para que o
    // cleanup do useBrandTheme remova as variáveis CSS, favicon e título.
    if (!user) {
      lastResolvedUserIdRef.current = null;
      if (brand) {
        setBrand(null);
        setBranches([]);
        setSelectedBranchState(null);
      }
      return;
    }

    // Já resolvido para este mesmo usuário e a marca atual bate com algum
    // role dele → nada a fazer (caso comum de re-renders).
    const roleBrandIds = new Set(
      roles.map((r) => r.brand_id).filter((v): v is string => !!v)
    );
    const brandMatchesUser = brand ? roleBrandIds.has(brand.id) : false;
    if (
      lastResolvedUserIdRef.current === user.id &&
      (brand === null || brandMatchesUser)
    ) {
      // Se não há brand ainda e não há role com brand, nada a fazer
      if (brand || roleBrandIds.size > 0) return;
      return;
    }

    // Usuário mudou OU brand atual não pertence aos roles dele
    // (vazamento entre logins). Re-resolve a partir dos roles.
    const roleWithBrand = roles.find((r) => r.brand_id);
    if (!roleWithBrand?.brand_id) {
      // Usuário sem brand_id em roles (root admin puro, etc.). Se a brand
      // atual é de um login anterior (não bate com roles), zera.
      if (brand && !brandMatchesUser) {
        setBrand(null);
        setBranches([]);
        setSelectedBranchState(null);
      }
      lastResolvedUserIdRef.current = user.id;
      return;
    }

    // Se a brand atual já é a correta para este usuário, só registra.
    if (brand && brand.id === roleWithBrand.brand_id) {
      lastResolvedUserIdRef.current = user.id;
      return;
    }

    let cancelled = false;
    (async () => {
      const brandData = await fetchBrandById(roleWithBrand.brand_id!);
      if (cancelled) return;
      if (brandData) {
        setBrand(brandData);
        // Reset branches/selected ao trocar de marca
        setBranches([]);
        setSelectedBranchState(null);
        lastResolvedUserIdRef.current = user.id;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [brand, loading, user, roles]);

  // Auto-detect branch by geolocation — deferred to avoid blocking initial render
  useEffect(() => {
    if (!brand || branches.length <= 1 || selectedBranch) return;
    const timer = setTimeout(() => {
      const autoDetect = async () => {
        const branchesWithCoords = branches.filter(
          (b) => b.latitude != null && b.longitude != null
        );
        if (branchesWithCoords.length === 0) return;
        const coords = await getCurrentPosition();
        if (!coords) return;
        const nearest = findNearestBranch(branchesWithCoords, coords);
        if (nearest) {
          setSelectedBranchState(nearest);
          if (user) {
            await supabase.from("profiles").update({ selected_branch_id: nearest.id }).eq("id", user.id);
          }
        }
      };
      autoDetect();
    }, 1500);
    return () => clearTimeout(timer);
  }, [brand, branches, selectedBranch, user]);

  // Memoizado pra evitar re-render em cascata dos 472 componentes que
  // consomem useBrand(). Antes, objeto inline novo a cada render do
  // provider causava cascata massiva de re-renders mesmo quando os
  // valores eram idênticos.
  const setSelectedBranch = React.useCallback(async (branch: Branch) => {
    setSelectedBranchState(branch);
    if (user) {
      await supabase.from("profiles").update({ selected_branch_id: branch.id }).eq("id", user.id);
    }
  }, [user]);

  const detectBranchByLocationCb = React.useCallback(async () => {
    const branchesWithCoords = branches.filter(
      (b) => b.latitude != null && b.longitude != null,
    );
    if (branchesWithCoords.length === 0) return null;
    const coords = await getCurrentPosition();
    if (!coords) return null;
    return findNearestBranch(branchesWithCoords, coords);
  }, [branches]);

  const contextValue = React.useMemo(
    () => ({
      brand,
      branches,
      selectedBranch,
      setSelectedBranch,
      loading,
      isWhiteLabel,
      theme,
      detectBranchByLocation: detectBranchByLocationCb,
    }),
    [brand, branches, selectedBranch, setSelectedBranch, loading, isWhiteLabel, theme, detectBranchByLocationCb],
  );

  return (
    <BrandContext.Provider value={contextValue}>
      {children}
    </BrandContext.Provider>
  );
}

function findNearestBranch(branches: Branch[], coords: Coords): Branch | null {
  let nearest: Branch | null = null;
  let minDist = Infinity;
  for (const b of branches) {
    const lat = b.latitude as number;
    const lng = b.longitude as number;
    const d = distanceKm(coords, { latitude: lat, longitude: lng });
    if (d < minDist) { minDist = d; nearest = b; }
  }
  return nearest;
}

/**
 * Override provider that accepts brand/branches as props,
 * skipping domain resolution and forcing isWhiteLabel = true.
 */
export function BrandProviderOverride({
  brand,
  branches: initialBranches,
  children,
}: {
  brand: Brand;
  branches: Branch[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [selectedBranch, setSelectedBranchState] = useState<Branch | null>(null);
  const branches = initialBranches;

  const theme = useBrandTheme(brand.brand_settings_json);

  // Auto-select if single branch
  useEffect(() => {
    if (branches.length === 1) {
      setSelectedBranchState(branches[0]);
    }
  }, [branches]);

  // Restore selected branch from profile
  useEffect(() => {
    if (!user || branches.length <= 1) return;
    const restore = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("selected_branch_id")
        .eq("id", user.id)
        .single();
      if (profile?.selected_branch_id) {
        const saved = branches.find((b) => b.id === profile.selected_branch_id);
        if (saved) setSelectedBranchState(saved);
      }
    };
    restore();
  }, [user, branches]);

  // Auto-detect branch by geolocation
  useEffect(() => {
    if (branches.length <= 1 || selectedBranch) return;
    const autoDetect = async () => {
      const branchesWithCoords = branches.filter(
        (b) => b.latitude != null && b.longitude != null
      );
      if (branchesWithCoords.length === 0) return;
      const coords = await getCurrentPosition();
      if (!coords) return;
      const nearest = findNearestBranch(branchesWithCoords, coords);
      if (nearest) {
        setSelectedBranchState(nearest);
        if (user) {
          await supabase.from("profiles").update({ selected_branch_id: nearest.id }).eq("id", user.id);
        }
      }
    };
    autoDetect();
  }, [branches, selectedBranch, user]);

  // Mesma memoização do BrandProvider principal — evita re-render em
  // cascata dos consumers de useBrand() dentro do white-label provider.
  const setSelectedBranch = React.useCallback(async (branch: Branch) => {
    setSelectedBranchState(branch);
    if (user) {
      await supabase.from("profiles").update({ selected_branch_id: branch.id }).eq("id", user.id);
    }
  }, [user]);

  const detectBranchByLocation = React.useCallback(async (): Promise<Branch | null> => {
    const branchesWithCoords = branches.filter(b => b.latitude != null && b.longitude != null);
    if (branchesWithCoords.length === 0) return null;
    const coords = await getCurrentPosition();
    if (!coords) return null;
    return findNearestBranch(branchesWithCoords, coords);
  }, [branches]);

  const contextValue = React.useMemo(
    () => ({
      brand,
      branches,
      selectedBranch,
      setSelectedBranch,
      loading: false,
      isWhiteLabel: true,
      theme,
      detectBranchByLocation,
    }),
    [brand, branches, selectedBranch, setSelectedBranch, theme, detectBranchByLocation],
  );

  return (
    <BrandContext.Provider value={contextValue}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) throw new Error("useBrand must be used within BrandProvider");
  return context;
}
