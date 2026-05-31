import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "../AuthContext";
import { setBootPhase } from "@/lib/bootState";
import {
  type Brand,
  fetchBrandById,
  resolveBrandByDomain,
  isLocalOrPortalHost,
  IS_LOCAL_HOST_SYNC,
  HAS_BRAND_ID_PARAM_SYNC,
} from "./utils";

interface BrandResolverContextType {
  brand: Brand | null;
  loading: boolean;
  isWhiteLabel: boolean;
  /** Útil pro Override mode injetar brand externa */
  _setBrand: (brand: Brand | null) => void;
}

const BrandResolverContext = createContext<BrandResolverContextType | undefined>(undefined);

export function BrandResolverProvider({ children }: { children: React.ReactNode }) {
  const { user, roles } = useAuth();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(!(IS_LOCAL_HOST_SYNC && !HAS_BRAND_ID_PARAM_SYNC));
  const [isWhiteLabel, setIsWhiteLabel] = useState(false);

  // Resolução inicial por hostname/param
  useEffect(() => {
    const resolve = async () => {
      const hostname = window.location.hostname;
      const brandIdParam = new URLSearchParams(window.location.search).get("brandId");
      const isLocal = isLocalOrPortalHost(hostname);

      if (isLocal && !brandIdParam) {
        setLoading(false);
        setBootPhase("BRAND_READY", "skip-local");
        return;
      }

      const safetyTimeout = setTimeout(() => {
        setLoading(false);
        setBootPhase("BRAND_READY", "timeout");
      }, 2000);

      setBootPhase("BRAND_LOADING");
      try {
        if (brandIdParam) {
          const brandData = await fetchBrandById(brandIdParam);
          if (brandData) setBrand(brandData);
          return;
        }
        setIsWhiteLabel(true);
        const resolved = await resolveBrandByDomain(hostname);
        setBrand(resolved);
      } catch (err) {
        console.error("BrandResolver error:", err);
      } finally {
        clearTimeout(safetyTimeout);
        setLoading(false);
        setBootPhase("BRAND_READY");
      }
    };
    resolve();
  }, []);

  // Re-resolve quando user/roles mudam (portal universal, troca de login)
  const lastResolvedUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (loading) return;

    if (!user) {
      lastResolvedUserIdRef.current = null;
      if (brand) setBrand(null);
      return;
    }

    const roleBrandIds = new Set(
      roles.map((r) => r.brand_id).filter((v): v is string => !!v)
    );
    const brandMatchesUser = brand ? roleBrandIds.has(brand.id) : false;
    if (
      lastResolvedUserIdRef.current === user.id &&
      (brand === null || brandMatchesUser)
    ) {
      if (brand || roleBrandIds.size > 0) return;
      return;
    }

    const roleWithBrand = roles.find((r) => r.brand_id);
    if (!roleWithBrand?.brand_id) {
      if (brand && !brandMatchesUser) setBrand(null);
      lastResolvedUserIdRef.current = user.id;
      return;
    }

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
        lastResolvedUserIdRef.current = user.id;
      }
    })();
    return () => { cancelled = true; };
  }, [brand, loading, user, roles]);

  const value = React.useMemo(
    () => ({ brand, loading, isWhiteLabel, _setBrand: setBrand }),
    [brand, loading, isWhiteLabel],
  );

  return (
    <BrandResolverContext.Provider value={value}>
      {children}
    </BrandResolverContext.Provider>
  );
}

/** Provider de override pra preview/white-label injetado externamente. */
export function BrandResolverOverride({
  brand,
  children,
}: {
  brand: Brand;
  children: React.ReactNode;
}) {
  const value = React.useMemo(
    () => ({
      brand,
      loading: false,
      isWhiteLabel: true,
      _setBrand: () => { /* no-op no override */ },
    }),
    [brand],
  );
  return (
    <BrandResolverContext.Provider value={value}>
      {children}
    </BrandResolverContext.Provider>
  );
}

export function useBrandResolver(): BrandResolverContextType {
  const ctx = useContext(BrandResolverContext);
  if (!ctx) throw new Error("useBrandResolver must be used within BrandResolverProvider");
  return ctx;
}
