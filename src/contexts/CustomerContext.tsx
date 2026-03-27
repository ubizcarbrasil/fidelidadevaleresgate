import React, { createContext, useContext, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useBrand } from "./BrandContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";

type Customer = Tables<"customers">;

interface CustomerContextType {
  customer: Customer | null;
  loading: boolean;
  isDriver: boolean;
  isImpersonating: boolean;
  refetch: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const { user, roles } = useAuth();
  const { brand, selectedBranch } = useBrand();
  const queryClient = useQueryClient();

  const impersonateCustomerId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("customerId");
  }, []);

  const isAdmin = useMemo(() => {
    if (!roles?.length) return false;
    const adminRoles = ["root_admin", "tenant_admin", "brand_admin", "branch_admin"];
    return roles.some((r) => adminRoles.includes(r.role));
  }, [roles]);

  const canImpersonate = !!impersonateCustomerId && isAdmin;

  const queryKey = ["customer-context", user?.id, brand?.id, selectedBranch?.id, impersonateCustomerId];

  const { data: customer = null, isLoading: loading } = useQuery({
    queryKey,
    enabled: !!user && !!brand && (!!selectedBranch || canImpersonate),
    queryFn: async () => {
      // Impersonation mode: fetch the specific customer directly
      if (canImpersonate) {
        const { data } = await supabase
          .from("customers")
          .select("*")
          .eq("id", impersonateCustomerId!)
          .eq("brand_id", brand!.id)
          .maybeSingle();
        return data;
      }

      // Normal flow: fetch any existing customer for this user + brand
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

      // Auto-vincular motorista órfão (criado pelo webhook sem user_id)
      const userEmail = user!.email;
      const userPhone = user!.user_metadata?.phone || null;

      const orFilters: string[] = [];
      if (userEmail) orFilters.push(`email.eq.${userEmail}`);
      if (userPhone) orFilters.push(`phone.eq.${userPhone}`);

      if (orFilters.length > 0) {
        const { data: orphans } = await supabase
          .from("customers")
          .select("*")
          .eq("brand_id", brand!.id)
          .is("user_id", null)
          .ilike("name", "%[MOTORISTA]%")
          .or(orFilters.join(","));

        const match = orphans?.[0];
        if (match) {
          const { data: linked } = await supabase
            .from("customers")
            .update({ user_id: user!.id, branch_id: selectedBranch!.id })
            .eq("id", match.id)
            .select("*")
            .maybeSingle();
          return linked || match;
        }
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

  const isDriver = !!(customer?.name && /\[MOTORISTA\]/i.test(customer.name));

  const refetch = async () => {
    await queryClient.invalidateQueries({ queryKey });
  };

  return (
    <CustomerContext.Provider value={{ customer, loading, isDriver, isImpersonating: canImpersonate, refetch }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) throw new Error("useCustomer must be used within CustomerProvider");
  return context;
}
