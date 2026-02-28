import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "./AuthContext";

type Brand = Tables<"brands">;
type Branch = Tables<"branches">;

interface BrandContextType {
  brand: Brand | null;
  branches: Branch[];
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch) => void;
  loading: boolean;
  isWhiteLabel: boolean;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

async function resolveBrandByDomain(hostname: string): Promise<Brand | null> {
  const { data } = await supabase
    .from("brand_domains")
    .select("brand_id")
    .eq("domain", hostname)
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

  // Resolve brand from domain
  useEffect(() => {
    const resolve = async () => {
      const hostname = window.location.hostname;

      // Skip resolution for localhost and preview domains
      const isLocal = hostname === "localhost" || hostname.includes("lovable.app") || hostname.includes("lovableproject.com");
      if (isLocal) {
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

      // Auto-select if only one branch
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

  const setSelectedBranch = async (branch: Branch) => {
    setSelectedBranchState(branch);
    if (user) {
      await supabase
        .from("profiles")
        .update({ selected_branch_id: branch.id })
        .eq("id", user.id);
    }
  };

  return (
    <BrandContext.Provider
      value={{ brand, branches, selectedBranch, setSelectedBranch, loading, isWhiteLabel }}
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
