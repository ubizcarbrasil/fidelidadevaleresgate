import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_ROLES = ["root_admin", "tenant_admin", "brand_admin", "branch_admin", "branch_operator", "operator_pdv"];

export function useStoreOwnerRedirect() {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (loading || !user) return;

    const hasAdminRole = roles.some(r => ADMIN_ROLES.includes(r.role));
    // If user has store_admin role, redirect immediately
    const isStoreAdmin = roles.some(r => r.role === "store_admin");

    if (hasAdminRole) {
      setIsRedirecting(false);
      return;
    }

    if (isStoreAdmin) {
      setIsRedirecting(true);
      navigate("/store-panel", { replace: true });
      return;
    }

    // Fallback: no roles at all, check DB for store ownership
    if (roles.length === 0) {
      let cancelled = false;
      setIsRedirecting(true);

      supabase
        .from("stores")
        .select("id")
        .eq("owner_user_id", user.id)
        .eq("approval_status", "APPROVED")
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (cancelled) return;
          if (data) {
            navigate("/store-panel", { replace: true });
          } else {
            setIsRedirecting(false);
          }
        });

      return () => { cancelled = true; };
    }
  }, [user, roles, loading, navigate]);

  return { isRedirecting };
}
