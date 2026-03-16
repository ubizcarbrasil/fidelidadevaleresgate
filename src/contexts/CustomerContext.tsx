import React, { createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useBrand } from "./BrandContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  const queryKey = ["customer-context", user?.id, brand?.id, selectedBranch?.id];

  const { data: customer = null, isLoading: loading } = useQuery({
    queryKey,
    enabled: !!user && !!brand && !!selectedBranch,
    queryFn: async () => {
      // Single query: fetch any existing customer for this user + brand
      const { data: existing } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user!.id)
        .eq("brand_id", brand!.id)
        .order("points_balance", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(5);

      // Check if one already matches the selected branch
      const inBranch = existing?.find((c) => c.branch_id === selectedBranch!.id);
      if (inBranch) return inBranch;

      // Reuse existing from another branch
      const best = existing?.[0];
      if (best) {
        if (best.branch_id !== selectedBranch!.id) {
          const { data: movedCustomer } = await supabase
            .from("customers")
            .update({ branch_id: selectedBranch!.id })
            .eq("id", best.id)
            .select("*")
            .maybeSingle();
          return movedCustomer || best;
        }
        return best;
      }

      // Auto-create customer record
      const name = user!.user_metadata?.full_name || user!.email?.split("@")[0] || "Cliente";
      const phone = user!.user_metadata?.phone || null;

      const { data: created, error } = await supabase
        .from("customers")
        .insert({
          user_id: user!.id,
          brand_id: brand!.id,
          branch_id: selectedBranch!.id,
          name,
          phone,
        })
        .select()
        .single();

      if (!error && created) return created;
      return null;
    },
  });

  const refetch = async () => {
    await queryClient.invalidateQueries({ queryKey });
  };

  return (
    <CustomerContext.Provider value={{ customer, loading, refetch }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) throw new Error("useCustomer must be used within CustomerProvider");
  return context;
}
