import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import * as Sentry from "@sentry/react";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole, UserRole } from "@/modules/auth/types";
import { logAudit } from "@/lib/auditLogger";
import { setBootPhase } from "@/lib/bootState";

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
  const mountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  const lastFetchedUserIdRef = useRef<string | null>(null);
  const lastFetchedAtRef = useRef<number>(0);

  const fetchRoles = async (userId: string, requestId: number) => {
    // Dedup: se já buscamos roles desse usuário nos últimos 2s, ignora.
    // Evita duplicação entre bootstrap e o evento SIGNED_IN do listener.
    const now = Date.now();
    if (
      lastFetchedUserIdRef.current === userId &&
      now - lastFetchedAtRef.current < 2000
    ) {
      return;
    }
    lastFetchedUserIdRef.current = userId;
    lastFetchedAtRef.current = now;

    try {
      const { data } = await supabase
        .from("user_roles")
        .select("id, role, tenant_id, brand_id, branch_id")
        .eq("user_id", userId);
      // Só aplica se ainda for o request mais recente e componente montado
      if (mountedRef.current && fetchIdRef.current === requestId) {
        const newRoles = (data || []) as UserRole[];
        setRoles((prev) => {
          // Comparação estrutural: evita nova referência quando conteúdo é igual,
          // prevenindo refetches em cascata em queries que dependem de roles.
          if (
            prev.length === newRoles.length &&
            prev.every((r, i) => r.id === newRoles[i]?.id)
          ) {
            return prev;
          }
          return newRoles;
        });
      }
    } catch (err) {
      console.warn("[AuthContext] Falha ao buscar roles:", err);
      if (mountedRef.current && fetchIdRef.current === requestId) {
        setRoles([]);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    let initialLoadDone = false;

    // Restauração inicial: sessão + roles antes de liberar loading
    const bootstrap = async () => {
      setBootPhase("AUTH_LOADING");
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!mountedRef.current) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const reqId = ++fetchIdRef.current;
          // Fire-and-forget: libera o loading sem esperar roles
          // (UI já consegue decidir rota com user; roles chegam logo em seguida)
          void fetchRoles(currentSession.user.id, reqId);
        }
      } catch (err) {
        console.warn("[AuthContext] Falha no bootstrap:", err);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setBootPhase("AUTH_READY");
          initialLoadDone = true;
        }
      }
    };

    void bootstrap();

    // Listener para mudanças de auth — NÃO async, fire-and-forget
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mountedRef.current) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          const reqId = ++fetchIdRef.current;
          void fetchRoles(newSession.user.id, reqId);
          Sentry.setUser({ id: newSession.user.id, email: newSession.user.email });
        } else {
          setRoles([]);
          Sentry.setUser(null);
        }

        // Só libera loading se o bootstrap inicial ainda não terminou
        if (!initialLoadDone) {
          setLoading(false);
          initialLoadDone = true;
        }

        // Audit fire-and-forget
        if (event === "SIGNED_IN" && newSession?.user) {
          void logAudit(newSession.user.id, { action: "LOGIN", entity_type: "auth" });
        } else if (event === "SIGNED_OUT") {
          void logAudit(null, { action: "LOGOUT", entity_type: "auth" });
        } else if (event === "PASSWORD_RECOVERY") {
          void logAudit(newSession?.user?.id ?? null, { action: "PASSWORD_RESET", entity_type: "auth" });
        }
      }
    );

    // Timeout de segurança — se em 8s o bootstrap não completou, libera
    const safetyTimer = setTimeout(() => {
      if (mountedRef.current && !initialLoadDone) {
        console.warn("[AuthContext] Bootstrap timeout — liberando loading");
        setBootPhase("AUTH_READY", "timeout");
        setLoading(false);
        initialLoadDone = true;
      }
    }, 5000);

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
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
