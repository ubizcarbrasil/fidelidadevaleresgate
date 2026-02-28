import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useStoreOwnerRedirect() {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    // If user has any admin roles, they belong in the admin dashboard
    if (roles.length > 0) return;

    let cancelled = false;

    async function checkStoreOwner() {
      setIsRedirecting(true);
      const { data } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_user_id", user!.id)
        .eq("approval_status", "APPROVED")
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (data) {
        navigate("/store-panel", { replace: true });
      } else {
        setIsRedirecting(false);
      }
    }

    checkStoreOwner();
    return () => { cancelled = true; };
  }, [user, roles, loading, navigate]);

  return { isRedirecting };
}
