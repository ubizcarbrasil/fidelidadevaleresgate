/**
 * DriverSessionContext — CPF-only login (sem auth.users), persistência em
 * localStorage por brand, edge function `driver-cpf-login` com fallback RPC,
 * rate limit detection, session request handoff entre tabs/sessões.
 *
 * Bug aqui = motorista loga numa brand e vaza dados em outra (storageKey),
 * rate limit não detectado (libera brute-force), edge function offline trava
 * login (sem fallback), legacy plain-CPF localStorage quebra parse JSON.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act, waitFor } from "@testing-library/react";

const { mockInvoke, mockRpc } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
  mockRpc: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: mockInvoke },
    rpc: mockRpc,
  },
}));

import {
  DriverSessionProvider,
  useDriverSession,
} from "../DriverSessionContext";

const BRAND_ID = "brand-1";

const DRIVER_ROW = {
  id: "drv-1",
  name: "Maria",
  cpf: "12345678910",
  email: null,
  phone: null,
  points_balance: 100,
  money_balance: 0,
  brand_id: BRAND_ID,
  branch_id: "br-1",
  branch_name: "Centro",
};

function Probe({ onCtx }: { onCtx: (ctx: ReturnType<typeof useDriverSession>) => void }) {
  const ctx = useDriverSession();
  React.useEffect(() => { onCtx(ctx); }, [ctx, onCtx]);
  return null;
}

function renderProvider(opts?: { sessionRequestKey?: string | null }) {
  const captured: { current: ReturnType<typeof useDriverSession> | null } = { current: null };
  const utils = render(
    <DriverSessionProvider brandId={BRAND_ID} sessionRequestKey={opts?.sessionRequestKey ?? null}>
      <Probe onCtx={(c) => { captured.current = c; }} />
    </DriverSessionProvider>,
  );
  return { ...utils, captured };
}

beforeEach(() => {
  mockInvoke.mockReset();
  mockRpc.mockReset();
  localStorage.clear();
});

describe("DriverSessionProvider — mount sem session", () => {
  it("sem cpf no storage: loading=false e driver=null", async () => {
    mockInvoke.mockResolvedValue({ data: null, error: null });
    const { captured } = renderProvider();
    await waitFor(() => expect(captured.current?.loading).toBe(false));
    expect(captured.current?.driver).toBeNull();
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it("cpf salvo no storage: restaura via edge function", async () => {
    localStorage.setItem(`driver_session_cpf_${BRAND_ID}`, "12345678910");
    mockInvoke.mockResolvedValue({ data: { driver: DRIVER_ROW }, error: null });

    const { captured } = renderProvider();
    await waitFor(() => expect(captured.current?.driver?.id).toBe("drv-1"));
    expect(captured.current?.driver?.name).toBe("Maria");
    expect(captured.current?.driver?.branches).toEqual({ name: "Centro" });
  });

  it("cpf salvo NÃO existe: remove do storage (cleanup)", async () => {
    localStorage.setItem(`driver_session_cpf_${BRAND_ID}`, "00000000000");
    mockInvoke.mockResolvedValue({ data: { error: "not_found" }, error: null });
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { captured } = renderProvider();
    await waitFor(() => expect(captured.current?.loading).toBe(false));
    expect(captured.current?.driver).toBeNull();
    expect(localStorage.getItem(`driver_session_cpf_${BRAND_ID}`)).toBeNull();
  });

  it("cpf salvo + rate limit: NÃO remove do storage (deixa tentar depois)", async () => {
    localStorage.setItem(`driver_session_cpf_${BRAND_ID}`, "12345678910");
    mockInvoke.mockResolvedValue({ data: { error: "rate_limited" }, error: null });

    const { captured } = renderProvider();
    await waitFor(() => expect(captured.current?.loading).toBe(false));
    expect(localStorage.getItem(`driver_session_cpf_${BRAND_ID}`)).toBe("12345678910");
  });
});

describe("loginByCpf", () => {
  it("CPF inválido (< 11 dígitos): erro local sem chamar backend", async () => {
    mockInvoke.mockResolvedValue({ data: null, error: null });
    const { captured } = renderProvider();
    await waitFor(() => expect(captured.current?.loading).toBe(false));
    mockInvoke.mockReset();

    let res: { success: boolean; error?: string } | undefined;
    await act(async () => {
      res = await captured.current!.loginByCpf("123");
    });
    expect(res?.success).toBe(false);
    expect(res?.error).toBe("CPF inválido");
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it("CPF válido: invoca edge function, seta driver, persiste storage", async () => {
    const { captured } = renderProvider();
    await waitFor(() => expect(captured.current?.loading).toBe(false));

    mockInvoke.mockResolvedValueOnce({ data: { driver: DRIVER_ROW }, error: null });

    let res: { success: boolean; error?: string } | undefined;
    await act(async () => {
      res = await captured.current!.loginByCpf("123.456.789-10");
    });
    expect(res?.success).toBe(true);
    expect(captured.current?.driver?.id).toBe("drv-1");
    expect(localStorage.getItem(`driver_session_cpf_${BRAND_ID}`)).toBe("12345678910");
  });

  it("rate limited via edge function: mensagem informativa", async () => {
    const { captured } = renderProvider();
    await waitFor(() => expect(captured.current?.loading).toBe(false));

    mockInvoke.mockResolvedValueOnce({ data: { error: "rate_limited" }, error: null });

    let res: { success: boolean; error?: string } | undefined;
    await act(async () => {
      res = await captured.current!.loginByCpf("12345678910");
    });
    expect(res?.success).toBe(false);
    expect(res?.error).toMatch(/Muitas tentativas/);
  });

  it("CPF não cadastrado: erro específico", async () => {
    const { captured } = renderProvider();
    await waitFor(() => expect(captured.current?.loading).toBe(false));

    mockInvoke.mockResolvedValueOnce({ data: { error: "not_found" }, error: null });
    mockRpc.mockResolvedValueOnce({ data: null, error: null });

    let res: { success: boolean; error?: string } | undefined;
    await act(async () => {
      res = await captured.current!.loginByCpf("99999999999");
    });
    expect(res?.success).toBe(false);
    expect(res?.error).toBe("CPF não cadastrado");
  });
});

describe("edge function fallback → RPC", () => {
  it("edge function 404 (não deployada): cai pro RPC e funciona", async () => {
    const { captured } = renderProvider();
    await waitFor(() => expect(captured.current?.loading).toBe(false));

    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: "Not deployed", context: { status: 404 } },
    });
    mockRpc.mockResolvedValueOnce({ data: [DRIVER_ROW], error: null });

    let res: { success: boolean } | undefined;
    await act(async () => {
      res = await captured.current!.loginByCpf("12345678910");
    });
    expect(res?.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith("lookup_driver_by_cpf", {
      p_brand_id: BRAND_ID,
      p_cpf: "12345678910",
    });
  });

  it("edge function lança exceção: cai pro RPC", async () => {
    const { captured } = renderProvider();
    await waitFor(() => expect(captured.current?.loading).toBe(false));

    mockInvoke.mockRejectedValueOnce(new Error("network down"));
    mockRpc.mockResolvedValueOnce({ data: [DRIVER_ROW], error: null });

    let res: { success: boolean } | undefined;
    await act(async () => {
      res = await captured.current!.loginByCpf("12345678910");
    });
    expect(res?.success).toBe(true);
  });

  it("RPC retorna rate limit (P0001 'Muitas tentativas'): rateLimited", async () => {
    const { captured } = renderProvider();
    await waitFor(() => expect(captured.current?.loading).toBe(false));

    mockInvoke.mockRejectedValueOnce(new Error("offline"));
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: "Muitas tentativas — tente em 15min" },
    });

    let res: { success: boolean; error?: string } | undefined;
    await act(async () => {
      res = await captured.current!.loginByCpf("12345678910");
    });
    expect(res?.error).toMatch(/Muitas tentativas/);
  });
});

describe("logout", () => {
  it("limpa driver + remove cpf do localStorage", async () => {
    localStorage.setItem(`driver_session_cpf_${BRAND_ID}`, "12345678910");
    mockInvoke.mockResolvedValueOnce({ data: { driver: DRIVER_ROW }, error: null });

    const { captured } = renderProvider();
    await waitFor(() => expect(captured.current?.driver?.id).toBe("drv-1"));

    act(() => { captured.current!.logout(); });

    await waitFor(() => expect(captured.current?.driver).toBeNull());
    expect(localStorage.getItem(`driver_session_cpf_${BRAND_ID}`)).toBeNull();
  });
});

describe("sessionRequestKey (handoff entre sessões)", () => {
  it("request JSON com customerId: usa lookup_driver_by_id", async () => {
    const reqKey = "req-abc";
    localStorage.setItem(
      `driver_session_request_${BRAND_ID}_${reqKey}`,
      JSON.stringify({ customerId: "drv-1" }),
    );
    mockRpc.mockImplementation((fn: string) => {
      if (fn === "lookup_driver_by_id") return Promise.resolve({ data: [DRIVER_ROW], error: null });
      return Promise.resolve({ data: null, error: null });
    });

    const { captured } = renderProvider({ sessionRequestKey: reqKey });
    await waitFor(() => expect(captured.current?.driver?.id).toBe("drv-1"));
    // request consumido
    expect(localStorage.getItem(`driver_session_request_${BRAND_ID}_${reqKey}`)).toBeNull();
    // cpf persistido pra próximas visitas
    expect(localStorage.getItem(`driver_session_cpf_${BRAND_ID}`)).toBe("12345678910");
  });

  it("request legacy (plain CPF formatado, JSON.parse falha): cai pra fetch por CPF", async () => {
    // formato legado tinha CPF com pontos/traços direto na key —
    // JSON.parse falha e o catch usa raw como cpf
    const reqKey = "req-legacy";
    localStorage.setItem(`driver_session_request_${BRAND_ID}_${reqKey}`, "123.456.789-10");
    mockInvoke.mockResolvedValueOnce({ data: { driver: DRIVER_ROW }, error: null });

    const { captured } = renderProvider({ sessionRequestKey: reqKey });
    await waitFor(() => expect(captured.current?.driver?.id).toBe("drv-1"));
    expect(mockInvoke).toHaveBeenCalledWith("driver-cpf-login", {
      body: { brandId: BRAND_ID, cpf: "123.456.789-10" },
    });
  });
});

describe("isolamento multi-brand (storageKey por brand)", () => {
  it("cpf salvo numa brand NÃO vaza pra outra", async () => {
    localStorage.setItem(`driver_session_cpf_brand-2`, "99999999999");
    mockInvoke.mockResolvedValue({ data: null, error: null });

    const { captured } = renderProvider();
    await waitFor(() => expect(captured.current?.loading).toBe(false));
    // brand-1 NÃO viu a entry de brand-2
    expect(mockInvoke).not.toHaveBeenCalled();
    expect(captured.current?.driver).toBeNull();
  });
});

describe("useDriverSession hook guard", () => {
  it("fora do Provider: lança erro descritivo", () => {
    function Orphan() {
      useDriverSession();
      return null;
    }
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() => render(<Orphan />)).toThrow(/useDriverSession must be used inside DriverSessionProvider/);
    } finally {
      spy.mockRestore();
    }
  });
});
