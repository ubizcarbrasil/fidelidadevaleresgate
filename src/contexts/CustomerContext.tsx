import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useBrand } from "./BrandContext";
import type { Tables } from "@/integrations/supabase/types";

type Customer = Tables<"customers">;

interface CustomerContextType {
  customer: Customer | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { brand, selectedBranch } = useBrand();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrCreate = async () => {
    if (!user || !brand || !selectedBranch) {
      setCustomer(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Single query: fetch any existing customer for this user + brand, prefer the one in the selected branch
    const { data: existing } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", user.id)
      .eq("brand_id", brand.id)
      .order("points_balance", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(5);

    // Check if one already matches the selected branch
    const inBranch = existing?.find((c) => c.branch_id === selectedBranch.id);
    if (inBranch) {
      setCustomer(inBranch);
      setLoading(false);
      return;
    }

    // Reuse existing from another branch
    const best = existing?.[0];
    if (best) {
      if (best.branch_id !== selectedBranch.id) {
        const { data: movedCustomer } = await supabase
          .from("customers")
          .update({ branch_id: selectedBranch.id })
          .eq("id", best.id)
          .select("*")
          .maybeSingle();
        setCustomer(movedCustomer || best);
      } else {
        setCustomer(best);
      }
      setLoading(false);
      return;
    }

    // Auto-create customer record
    const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "Cliente";
    const phone = user.user_metadata?.phone || null;

    const { data: created, error } = await supabase
      .from("customers")
      .insert({
        user_id: user.id,
        brand_id: brand.id,
        branch_id: selectedBranch.id,
        name,
        phone,
      })
      .select()
      .single();

    if (!error && created) {
      setCustomer(created);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrCreate();
  }, [user, brand, selectedBranch]);

  return (
    <CustomerContext.Provider value={{ customer, loading, refetch: fetchOrCreate }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) throw new Error("useCustomer must be used within CustomerProvider");
  return context;
}
