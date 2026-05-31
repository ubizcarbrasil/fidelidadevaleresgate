import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentPosition } from "@/lib/geolocation";
import { type Branch, findNearestBranch } from "./utils";
import { useBrandResolver } from "./BrandResolverContext";

interface BrandDataContextType {
  branches: Branch[];
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch) => void;
  detectBranchByLocation: () => Promise<Branch | null>;
}

const BrandDataContext = createContext<BrandDataContextType | undefined>(undefined);

interface BrandDataProviderProps {
  children: React.ReactNode;
  /** Override mode: lista de branches injetada (pula fetch). */
  initialBranches?: Branch[];
}

export function BrandDataProvider({ children, initialBranches }: BrandDataProviderProps) {
  const { user } = useAuth();
  const { brand } = useBrandResolver();

  const [branches, setBranches] = useState<Branch[]>(initialBranches ?? []);
  const [selectedBranch, setSelectedBranchState] = useState<Branch | null>(null);

  // Fetch branches when brand is resolved (skip in override mode).
  // Limpa selectedBranch ao trocar de brand pra não vazar branch de tenant
  // anterior durante o gap entre re-resolução e novo fetch.
  useEffect(() => {
    if (initialBranches) return;
    if (!brand) {
      if (!user) {
        setBranches([]);
        setSelectedBranchState(null);
      }
      return;
    }

    setSelectedBranchState(null);

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
  }, [brand, user, initialBranches]);

  // Override mode: restaurar branch do profile quando há múltiplas
  useEffect(() => {
    if (!initialBranches) return;
    if (initialBranches.length === 1) {
      setSelectedBranchState(initialBranches[0]);
      return;
    }
    if (!user || initialBranches.length <= 1) return;
    const restore = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("selected_branch_id")
        .eq("id", user.id)
        .single();
      if (profile?.selected_branch_id) {
        const saved = initialBranches.find((b) => b.id === profile.selected_branch_id);
        if (saved) setSelectedBranchState(saved);
      }
    };
    restore();
  }, [user, initialBranches]);

  // Auto-detect branch by geolocation (deferred 1.5s pra não bloquear primeiro render)
  useEffect(() => {
    if (branches.length <= 1 || selectedBranch) return;
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
  }, [branches, selectedBranch, user]);

  const setSelectedBranch = React.useCallback(async (branch: Branch) => {
    setSelectedBranchState(branch);
    if (user) {
      await supabase.from("profiles").update({ selected_branch_id: branch.id }).eq("id", user.id);
    }
  }, [user]);

  const detectBranchByLocation = React.useCallback(async () => {
    const branchesWithCoords = branches.filter(
      (b) => b.latitude != null && b.longitude != null,
    );
    if (branchesWithCoords.length === 0) return null;
    const coords = await getCurrentPosition();
    if (!coords) return null;
    return findNearestBranch(branchesWithCoords, coords);
  }, [branches]);

  const value = React.useMemo(
    () => ({ branches, selectedBranch, setSelectedBranch, detectBranchByLocation }),
    [branches, selectedBranch, setSelectedBranch, detectBranchByLocation],
  );

  return (
    <BrandDataContext.Provider value={value}>
      {children}
    </BrandDataContext.Provider>
  );
}

export function useBrandData(): BrandDataContextType {
  const ctx = useContext(BrandDataContext);
  if (!ctx) throw new Error("useBrandData must be used within BrandDataProvider");
  return ctx;
}
