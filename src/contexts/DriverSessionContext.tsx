import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DriverCustomer {
  id: string;
  name: string;
  cpf: string | null;
  email: string | null;
  phone: string | null;
  points_balance: number;
  money_balance: number;
  brand_id: string;
  branch_id: string;
  branches?: { name: string } | null;
}

interface DriverSessionContextType {
  driver: DriverCustomer | null;
  loading: boolean;
  loginByCpf: (cpf: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshDriver: () => Promise<void>;
}

const DriverSessionContext = createContext<DriverSessionContextType | null>(null);

function cleanCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

function storageKey(brandId: string) {
  return `driver_session_cpf_${brandId}`;
}

function requestStorageKey(brandId: string, requestKey: string) {
  return `driver_session_request_${brandId}_${requestKey}`;
}

function parseRow(row: any): DriverCustomer {
  return {
    id: row.id,
    name: row.name,
    cpf: row.cpf,
    email: row.email,
    phone: row.phone,
    points_balance: row.points_balance,
    money_balance: row.money_balance,
    brand_id: row.brand_id,
    branch_id: row.branch_id,
    branches: row.branch_name ? { name: row.branch_name } : null,
  };
}

async function fetchDriverByCpf(
  brandId: string,
  cpf: string,
): Promise<{ driver: DriverCustomer | null; rateLimited?: boolean }> {
  // Tenta edge function `driver-cpf-login` primeiro pra ter:
  // - Rate limit por IP (max 30 falhas/15min) — barra brute-force que
  //   rotaciona CPFs (não pego pelo rate limit por cpf_hash do RPC).
  // - Auditoria centralizada de tentativas por IP.
  // - Mascaramento LGPD garantido (email/phone/money_balance = null/0).
  // Se a edge function não estiver deployada (404) ou der erro de rede,
  // cai pro fallback RPC direto (mantém compat durante deploy gradual).
  try {
    const { data, error } = await supabase.functions.invoke("driver-cpf-login", {
      body: { brandId, cpf },
    });
    if (!error && data?.driver) {
      return { driver: parseRow(data.driver) };
    }
    if (!error && data?.error === "rate_limited") {
      return { driver: null, rateLimited: true };
    }
    if (!error && data?.error) {
      // edge function respondeu com erro estruturado (not_found, etc.)
      // — cai no fallback pra preservar comportamento legado caso ela
      // esteja com bug
      console.info("[DriverSession] edge function bloqueou:", data.error, data.message);
    }
    if (error) {
      const isNotDeployed = (error as { context?: { status?: number } })?.context?.status === 404;
      if (!isNotDeployed) {
        console.warn("[DriverSession] login via edge function falhou, fallback RPC:", error.message);
      }
    }
  } catch (err) {
    console.warn("[DriverSession] exceção na edge function, fallback RPC:", err);
  }

  // Fallback: RPC direta (PR #21 já tem rate limit por cpf_hash + mascaramento)
  const { data, error } = await supabase
    .rpc("lookup_driver_by_cpf", { p_brand_id: brandId, p_cpf: cpf });
  // Migração 20260519002728 retorna erro P0001 quando rate limit é atingido.
  if (error) {
    const msg = (error as { message?: string }).message ?? "";
    if (msg.includes("Muitas tentativas")) {
      return { driver: null, rateLimited: true };
    }
    return { driver: null };
  }
  if (!data || (Array.isArray(data) && data.length === 0)) return { driver: null };
  const row = Array.isArray(data) ? data[0] : data;
  return { driver: parseRow(row) };
}

async function fetchDriverById(brandId: string, customerId: string): Promise<DriverCustomer | null> {
  const { data, error } = await (supabase as any)
    .rpc("lookup_driver_by_id", { p_brand_id: brandId, p_customer_id: customerId });
  if (error || !data || (Array.isArray(data) && data.length === 0)) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return parseRow(row);
}

interface SessionRequest {
  customerId?: string;
  cpf?: string | null;
}

function readSessionRequest(brandId: string, key: string | null): SessionRequest | null {
  if (!key) return null;
  const raw = localStorage.getItem(requestStorageKey(brandId, key));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionRequest;
  } catch {
    // Legacy format: plain CPF string
    return { cpf: raw };
  }
}

async function fetchDriverFromRequest(brandId: string, req: SessionRequest): Promise<DriverCustomer | null> {
  if (req.customerId) {
    const d = await fetchDriverById(brandId, req.customerId);
    if (d) return d;
  }
  if (req.cpf) {
    const result = await fetchDriverByCpf(brandId, req.cpf);
    return result.driver;
  }
  return null;
}

export function DriverSessionProvider({
  brandId,
  sessionRequestKey,
  children,
}: {
  brandId: string;
  sessionRequestKey?: string | null;
  children: React.ReactNode;
}) {
  const [driver, setDriver] = useState<DriverCustomer | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    const sessionRequest = readSessionRequest(brandId, sessionRequestKey ?? null);

    const restore = async () => {
      let d: DriverCustomer | null = null;

      if (sessionRequest) {
        d = await fetchDriverFromRequest(brandId, sessionRequest);
        if (d?.cpf) {
          localStorage.setItem(storageKey(brandId), cleanCpf(d.cpf));
        }
        if (sessionRequestKey) {
          localStorage.removeItem(requestStorageKey(brandId, sessionRequestKey));
        }
      }

      if (!d) {
        const savedCpf = localStorage.getItem(storageKey(brandId));
        if (savedCpf) {
          const result = await fetchDriverByCpf(brandId, savedCpf);
          d = result.driver;
          if (!d && !result.rateLimited) {
            // Só remove se realmente não existe — não remove se foi rate limit
            // (pra usuário poder tentar de novo depois sem precisar relogar)
            localStorage.removeItem(storageKey(brandId));
          }
        }
      }

      if (d) setDriver(d);
      setLoading(false);
    };

    restore();
  }, [brandId, sessionRequestKey]);

  const loginByCpf = useCallback(
    async (cpf: string): Promise<{ success: boolean; error?: string }> => {
      const clean = cleanCpf(cpf);
      if (clean.length !== 11) return { success: false, error: "CPF inválido" };
      const { driver: d, rateLimited } = await fetchDriverByCpf(brandId, clean);
      if (rateLimited) {
        return { success: false, error: "Muitas tentativas. Aguarde 15 minutos e tente novamente." };
      }
      if (!d) return { success: false, error: "CPF não cadastrado" };
      setDriver(d);
      localStorage.setItem(storageKey(brandId), clean);
      return { success: true };
    },
    [brandId]
  );

  const logout = useCallback(() => {
    setDriver(null);
    localStorage.removeItem(storageKey(brandId));
  }, [brandId]);

  const refreshDriver = useCallback(async () => {
    if (!driver) return;
    // Refresh by ID first, fallback to CPF
    let d: DriverCustomer | null = null;
    d = await fetchDriverById(brandId, driver.id);
    if (!d && driver.cpf) {
      const result = await fetchDriverByCpf(brandId, cleanCpf(driver.cpf));
      d = result.driver;
    }
    if (d) setDriver(d);
  }, [brandId, driver]);

  // Re-check localStorage when tab regains focus
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;

      const sessionRequest = readSessionRequest(brandId, sessionRequestKey ?? null);

      if (sessionRequest) {
        setLoading(true);
        fetchDriverFromRequest(brandId, sessionRequest).then((d) => {
          if (d) {
            setDriver(d);
            if (d.cpf) localStorage.setItem(storageKey(brandId), cleanCpf(d.cpf));
          }
          if (sessionRequestKey) {
            localStorage.removeItem(requestStorageKey(brandId, sessionRequestKey));
          }
          setLoading(false);
        });
        return;
      }

      const savedCpf = localStorage.getItem(storageKey(brandId));
      const currentCpf = driver?.cpf ? cleanCpf(driver.cpf) : null;

      if (savedCpf && savedCpf !== currentCpf) {
        setLoading(true);
        fetchDriverByCpf(brandId, savedCpf).then(({ driver: d }) => {
          if (d) {
            setDriver(d);
            localStorage.setItem(storageKey(brandId), cleanCpf(savedCpf));
          }
          setLoading(false);
        });
      } else if (!savedCpf && driver) {
        setDriver(null);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [brandId, driver, sessionRequestKey]);

  // Memoizado: 32 consumers de useDriverSession() não devem re-render
  // quando value identity muda sem motivo.
  const contextValue = React.useMemo(
    () => ({ driver, loading, loginByCpf, logout, refreshDriver }),
    [driver, loading, loginByCpf, logout, refreshDriver],
  );

  return (
    <DriverSessionContext.Provider value={contextValue}>
      {children}
    </DriverSessionContext.Provider>
  );
}

export function useDriverSession() {
  const ctx = useContext(DriverSessionContext);
  if (!ctx) throw new Error("useDriverSession must be used inside DriverSessionProvider");
  return ctx;
}
