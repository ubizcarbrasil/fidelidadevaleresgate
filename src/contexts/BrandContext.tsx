import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "./AuthContext";
import { getCurrentPosition, distanceKm, type Coords } from "@/lib/geolocation";
import { useBrandTheme, type BrandTheme } from "@/hooks/useBrandTheme";
import { setBootPhase } from "@/lib/bootState";

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
 * Fetch brand data by ID using the public-safe view first (works for anon),
 * falling back to the full brands table (works for authenticated users).
 */
async function fetchBrandById(brandId: string): Promise<Brand | null> {
  // Try public view first (accessible to anonymous users)
  const { data: publicBrand } = await supabase
    .from("public_brands_safe")
    .select("*")
    .eq("id", brandId)
    .single();

  if (publicBrand) {
    // Cast — the public view has the same core fields
    return publicBrand as unknown as Brand;
  }

  // Fallback for authenticated users with RLS access
  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("id", brandId)
    .single();

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

  for (const domain of domainsToTry) {
    const { data } = await supabase
      .from("brand_domains")
      .select("brand_id")
      .eq("domain", domain)
      .eq("is_active", true)
      .maybeSingle();

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
  useEffect(() => {
    if (brand || loading) return;
    if (!user) return;
    const roleWithBrand = roles.find((r) => r.brand_id);
    if (!roleWithBrand?.brand_id) return;
    let cancelled = false;
    (async () => {
      const brandData = await fetchBrandById(roleWithBrand.brand_id!);
      if (!cancelled && brandData) setBrand(brandData);
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

  const detectBranchByLocation = async (): Promise<Branch | null> => {
    const branchesWithCoords = branches.filter(b => b.latitude != null && b.longitude != null);
    if (branchesWithCoords.length === 0) return null;
    const coords = await getCurrentPosition();
    if (!coords) return null;
    return findNearestBranch(branchesWithCoords, coords);
  };

  const setSelectedBranch = async (branch: Branch) => {
    setSelectedBranchState(branch);
    if (user) {
      await supabase.from("profiles").update({ selected_branch_id: branch.id }).eq("id", user.id);
    }
  };

  return (
    <BrandContext.Provider value={{ brand, branches, selectedBranch, setSelectedBranch, loading, isWhiteLabel, theme, detectBranchByLocation }}>
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

  const detectBranchByLocation = async (): Promise<Branch | null> => {
    const branchesWithCoords = branches.filter(b => b.latitude != null && b.longitude != null);
    if (branchesWithCoords.length === 0) return null;
    const coords = await getCurrentPosition();
    if (!coords) return null;
    return findNearestBranch(branchesWithCoords, coords);
  };

  const setSelectedBranch = async (branch: Branch) => {
    setSelectedBranchState(branch);
    if (user) {
      await supabase.from("profiles").update({ selected_branch_id: branch.id }).eq("id", user.id);
    }
  };

  return (
    <BrandContext.Provider
      value={{
        brand,
        branches,
        selectedBranch,
        setSelectedBranch,
        loading: false,
        isWhiteLabel: true,
        theme,
        detectBranchByLocation,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) throw new Error("useBrand must be used within BrandProvider");
  return context;
}
