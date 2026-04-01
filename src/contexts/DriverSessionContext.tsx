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

async function fetchDriverByCpf(brandId: string, cpf: string): Promise<DriverCustomer | null> {
  const { data, error } = await supabase
    .rpc("lookup_driver_by_cpf", { p_brand_id: brandId, p_cpf: cpf });
  if (error || !data || (Array.isArray(data) && data.length === 0)) return null;
  const row = Array.isArray(data) ? data[0] : data;
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
  } as DriverCustomer;
}

export function DriverSessionProvider({
  brandId,
  children,
}: {
  brandId: string;
  children: React.ReactNode;
}) {
  const [driver, setDriver] = useState<DriverCustomer | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    const savedCpf = localStorage.getItem(storageKey(brandId));
    if (!savedCpf) {
      setLoading(false);
      return;
    }
    fetchDriverByCpf(brandId, savedCpf).then((d) => {
      if (d) setDriver(d);
      else localStorage.removeItem(storageKey(brandId));
      setLoading(false);
    });
  }, [brandId]);

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
    const d = await fetchDriverByCpf(brandId, cleanCpf(driver.cpf || ""));
    if (d) setDriver(d);
  }, [brandId, driver]);

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
