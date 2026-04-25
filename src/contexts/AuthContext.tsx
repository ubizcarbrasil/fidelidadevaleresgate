import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import * as Sentry from "@sentry/react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole, UserRole } from "@/modules/auth/types";
import { logAudit } from "@/lib/auditLogger";
import { setBootPhase } from "@/lib/bootState";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  roles: UserRole[];
  loading: boolean;
  /**
   * True quando a busca em user_roles terminou (mesmo que tenha vindo
   * vazia). Usado por guards para distinguir "ainda carregando" de
   * "usuário sem roles" — antes a UI assumia LOADING quando roles
   * estava vazio, o que prendia o app na TelaCarregamento.
   */
  rolesCarregados: boolean;
  hasRole: (role: AppRole) => boolean;
  isRootAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesCarregados, setRolesCarregados] = useState(false);
  const mountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  // Deduplica fetchRoles em curso para o mesmo userId.
  // Quando bootstrap e onAuthStateChange disparam para o mesmo
  // usuário (caso comum no SIGNED_IN logo após login), a segunda
  // chamada reaproveita a Promise da primeira em vez de abrir
  // outra conexão HTTP que concorreria pela mesma resposta.
  const inFlightUserIdRef = useRef<string | null>(null);
  const inFlightPromiseRef = useRef<Promise<void> | null>(null);

  const fetchRoles = async (userId: string, requestId: number) => {
    // Se já existe uma busca em curso para o mesmo user, aguarda ela
    if (inFlightUserIdRef.current === userId && inFlightPromiseRef.current) {
      return inFlightPromiseRef.current;
    }

    inFlightUserIdRef.current = userId;
    const promise = (async () => {
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
        setRolesCarregados(true);
      }
    } catch (err) {
      console.warn("[AuthContext] Falha ao buscar roles:", err);
      if (mountedRef.current && fetchIdRef.current === requestId) {
        setRoles([]);
        // Em erro, também marcamos como "carregado" para não prender
        // a UI no loader. O guard cuida do fallback de permissões.
        setRolesCarregados(true);
      }
    }
    })();
    inFlightPromiseRef.current = promise;
    try {
      await promise;
    } finally {
      if (inFlightUserIdRef.current === userId) {
        inFlightUserIdRef.current = null;
        inFlightPromiseRef.current = null;
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
        } else {
          // Sem sessão: já podemos considerar permissões "carregadas"
          // (vazias) — guards públicos liberam imediatamente.
          setRolesCarregados(true);
        }
      } catch (err) {
        console.warn("[AuthContext] Falha no bootstrap:", err);
        setRolesCarregados(true);
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
          setRolesCarregados(true);
          Sentry.setUser(null);
        }

        // Só libera loading se o bootstrap inicial ainda não terminou
        if (!initialLoadDone) {
          setLoading(false);
          initialLoadDone = true;
        }

        // Audit adiado para idle — não compete pela conexão HTTP no
        // caminho crítico do login/redirect.
        const deferAudit = (cb: () => void) => {
          const ric = (window as any).requestIdleCallback;
          if (typeof ric === "function") ric(cb, { timeout: 2000 });
          else setTimeout(cb, 800);
        };
        if (event === "SIGNED_IN" && newSession?.user) {
          const uid = newSession.user.id;
          deferAudit(() => logAudit(uid, { action: "LOGIN", entity_type: "auth" }));
        } else if (event === "SIGNED_OUT") {
          deferAudit(() => logAudit(null, { action: "LOGOUT", entity_type: "auth" }));
        } else if (event === "PASSWORD_RECOVERY") {
          const uid = newSession?.user?.id ?? null;
          deferAudit(() => logAudit(uid, { action: "PASSWORD_RESET", entity_type: "auth" }));
        }
      }
    );

    // Timeout de segurança — se em 8s o bootstrap não completou, libera
    const safetyTimer = setTimeout(() => {
      if (mountedRef.current && !initialLoadDone) {
        console.warn("[AuthContext] Bootstrap timeout — liberando loading");
        setBootPhase("AUTH_READY", "timeout");
        setLoading(false);
        setRolesCarregados(true);
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
    // Limpa o cache do React Query antes do signOut para evitar que
    // dados sensíveis do usuário anterior (incluindo branding/marca)
    // vazem para o próximo login na mesma aba.
    try {
      queryClient.clear();
    } catch {
      /* noop */
    }
    await supabase.auth.signOut();
    setRoles([]);
    setRolesCarregados(true);
  };

  return (
    <AuthContext.Provider value={{ session, user, roles, loading, rolesCarregados, hasRole, isRootAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
