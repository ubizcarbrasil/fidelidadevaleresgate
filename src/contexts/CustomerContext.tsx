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

    // Try to find existing customer in selected branch first
    const { data: existingInBranch } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", user.id)
      .eq("brand_id", brand.id)
      .eq("branch_id", selectedBranch.id)
      .maybeSingle();

    if (existingInBranch) {
      setCustomer(existingInBranch);
      setLoading(false);
      return;
    }

    // Fallback: reuse any existing customer from same brand to avoid creating a new zero-balance profile
    const { data: existingInBrand } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", user.id)
      .eq("brand_id", brand.id)
      .order("points_balance", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingInBrand) {
      if (existingInBrand.branch_id !== selectedBranch.id) {
        const { data: movedCustomer } = await supabase
          .from("customers")
          .update({ branch_id: selectedBranch.id })
          .eq("id", existingInBrand.id)
          .select("*")
          .maybeSingle();

        setCustomer(movedCustomer || existingInBrand);
      } else {
        setCustomer(existingInBrand);
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
