import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole, UserRole } from "@/modules/auth/types";
import { logAudit } from "@/lib/auditLogger";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  roles: UserRole[];
  loading: boolean;
  hasRole: (role: AppRole) => boolean;
  isRootAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("id, role, tenant_id, brand_id, branch_id")
      .eq("user_id", userId);
    setRoles(data || []);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchRoles(session.user.id), 0);
        } else {
          setRoles([]);
        }
        // Audit critical auth events
        if (event === "SIGNED_IN" && session?.user) {
          logAudit(session.user.id, { action: "LOGIN", entity_type: "auth" });
        } else if (event === "SIGNED_OUT") {
          logAudit(user?.id ?? null, { action: "LOGOUT", entity_type: "auth" });
        } else if (event === "PASSWORD_RECOVERY") {
          logAudit(session?.user?.id ?? null, { action: "PASSWORD_RESET", entity_type: "auth" });
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasRole = (role: AppRole) => roles.some((r) => r.role === role);
  const isRootAdmin = hasRole("root_admin");

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
  };

  return (
    <AuthContext.Provider value={{ session, user, roles, loading, hasRole, isRootAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
