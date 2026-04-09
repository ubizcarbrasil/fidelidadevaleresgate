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

async function fetchDriverByCpf(brandId: string, cpf: string): Promise<DriverCustomer | null> {
  const { data, error } = await supabase
    .rpc("lookup_driver_by_cpf", { p_brand_id: brandId, p_cpf: cpf });
  if (error || !data || (Array.isArray(data) && data.length === 0)) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return parseRow(row);
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
    return fetchDriverByCpf(brandId, req.cpf);
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
          d = await fetchDriverByCpf(brandId, savedCpf);
          if (!d) {
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
      const d = await fetchDriverByCpf(brandId, clean);
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
      d = await fetchDriverByCpf(brandId, cleanCpf(driver.cpf));
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
        fetchDriverByCpf(brandId, savedCpf).then((d) => {
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

  return (
    <DriverSessionContext.Provider value={{ driver, loading, loginByCpf, logout, refreshDriver }}>
      {children}
    </DriverSessionContext.Provider>
  );
}

export function useDriverSession() {
  const ctx = useContext(DriverSessionContext);
  if (!ctx) throw new Error("useDriverSession must be used inside DriverSessionProvider");
  return ctx;
}
