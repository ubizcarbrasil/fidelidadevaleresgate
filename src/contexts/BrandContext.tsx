import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "./AuthContext";
import { getCurrentPosition, distanceKm, type Coords } from "@/lib/geolocation";
import { useBrandTheme, type BrandTheme } from "@/hooks/useBrandTheme";

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
async function resolveBrandByDomain(hostname: string): Promise<Brand | null> {
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
        const { data: brand } = await supabase
          .from("brands")
          .select("*")
          .eq("id", subdomainMatch.brand_id)
          .single();
        return brand;
      }
    }
  }

  // 2) Fallback: full domain match
  const { data } = await supabase
    .from("brand_domains")
    .select("brand_id")
    .eq("domain", hostname)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return null;

  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("id", data.brand_id)
    .single();

  return brand;
}

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranchState] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWhiteLabel, setIsWhiteLabel] = useState(false);

  const theme = useBrandTheme(brand?.brand_settings_json);

  useEffect(() => {
    const resolve = async () => {
      const hostname = window.location.hostname;

      // Skip resolution for dev/preview/root domains
      const isLocal = hostname === "localhost"
        || hostname.includes("lovable.app")
        || hostname.includes("lovableproject.com")
        || hostname.startsWith("root.");

      if (isLocal) {
        // Check for brandId URL parameter (root admin impersonation)
        const params = new URLSearchParams(window.location.search);
        const brandIdParam = params.get("brandId");
        if (brandIdParam) {
          const { data: brandData } = await supabase
            .from("brands")
            .select("*")
            .eq("id", brandIdParam)
            .single();
          if (brandData) {
            setBrand(brandData);
          }
        }
        setLoading(false);
        return;
      }

      setIsWhiteLabel(true);
      const resolved = await resolveBrandByDomain(hostname);
      setBrand(resolved);
      setLoading(false);
    };
    resolve();
  }, []);

  // Load branches when brand is resolved
  useEffect(() => {
    if (!brand) return;
    const fetchBranches = async () => {
      const { data } = await supabase
        .from("branches")
        .select("*")
        .eq("brand_id", brand.id)
        .eq("is_active", true)
        .order("name");
      setBranches(data || []);
      if (data && data.length === 1) {
        setSelectedBranchState(data[0]);
      }
    };
    fetchBranches();
  }, [brand]);

  // Restore selected branch from profile
  useEffect(() => {
    if (!user || !brand || branches.length <= 1) return;
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
  }, [user, brand, branches]);

  // Auto-detect branch by geolocation
  useEffect(() => {
    if (!brand || branches.length <= 1 || selectedBranch) return;
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
