/**
 * AuthContext — bootstrap (getSession + roles), onAuthStateChange (SIGNED_IN/
 * SIGNED_OUT/PASSWORD_RECOVERY), hasRole + isRootAdmin, signOut voluntário
 * vs sessão expirada, returnTo persistido em sessionStorage, dedup de
 * fetchRoles concorrente, retry exponencial em transient network error.
 *
 * Bug aqui = logout não limpa cache (dados vazam entre contas), sessão
 * expirada não dispara dialog (UX silenciosa), roles fetched 2x (race),
 * isRootAdmin perde sync depois de refresh.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const {
  mockGetSession,
  mockOnAuthStateChange,
  mockSignOut,
  mockFrom,
  mockLogAudit,
  mockIdentify,
  mockResetIdentity,
  mockSetBootPhase,
  mockGetBootContext,
  mockSentrySetUser,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockSignOut: vi.fn(),
  mockFrom: vi.fn(),
  mockLogAudit: vi.fn(),
  mockIdentify: vi.fn(),
  mockResetIdentity: vi.fn(),
  mockSetBootPhase: vi.fn(),
  mockGetBootContext: vi.fn(),
  mockSentrySetUser: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signOut: mockSignOut,
    },
    from: mockFrom,
  },
}));

vi.mock("@sentry/react", () => ({
  setUser: mockSentrySetUser,
}));

vi.mock("@/lib/auditLogger", () => ({
  logAudit: mockLogAudit,
}));

vi.mock("@/lib/analytics", () => ({
  identify: mockIdentify,
  resetIdentity: mockResetIdentity,
}));

vi.mock("@/lib/bootState", () => ({
  setBootPhase: mockSetBootPhase,
}));

vi.mock("@/lib/bootContext", () => ({
  getBootContext: mockGetBootContext,
}));

vi.mock("@/lib/bootMetrics", () => ({
  bootMark: vi.fn(),
}));

import { AuthProvider, useAuth, AUTH_RETURN_TO_KEY } from "../AuthContext";

const USER = { id: "u1", email: "admin@test.com" };
const SESSION = { user: USER, access_token: "tok" };
const ROLE_ROOT = { id: "r1", role: "root_admin", tenant_id: null, brand_id: null, branch_id: null };
const ROLE_BRAND = { id: "r2", role: "brand_admin", tenant_id: null, brand_id: "b1", branch_id: null };

function Probe({ onCtx }: { onCtx: (ctx: ReturnType<typeof useAuth>) => void }) {
  const ctx = useAuth();
  React.useEffect(() => { onCtx(ctx); }, [ctx, onCtx]);
  return null;
}

function makeRolesChain(data: unknown[], error: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data, error }),
  };
}

function renderWithAuth() {
  const captured: { current: ReturnType<typeof useAuth> | null } = { current: null };
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const queryClearSpy = vi.spyOn(queryClient, "clear");
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Probe onCtx={(c) => { captured.current = c; }} />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return { ...utils, captured, queryClearSpy };
}

// Storage do listener pra invocar SIGNED_IN/SIGNED_OUT manualmente
let authStateHandler: ((event: string, session: unknown) => void) | null = null;

beforeEach(() => {
  mockGetSession.mockReset();
  mockOnAuthStateChange.mockReset();
  mockSignOut.mockReset();
  mockFrom.mockReset();
  mockLogAudit.mockReset();
  mockIdentify.mockReset();
  mockResetIdentity.mockReset();
  mockSetBootPhase.mockReset();
  mockGetBootContext.mockReset();
  mockGetBootContext.mockResolvedValue(null);
  mockSentrySetUser.mockReset();
  sessionStorage.clear();

  mockOnAuthStateChange.mockImplementation((cb: typeof authStateHandler) => {
    authStateHandler = cb;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
});

// ────────────────────────────────────────────────────────
// Bootstrap
// ────────────────────────────────────────────────────────
describe("AuthProvider — bootstrap", () => {
  it("sem sessão: loading=false, user=null, rolesCarregados=true", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const { captured } = renderWithAuth();
    await waitFor(() => expect(captured.current?.loading).toBe(false));
    expect(captured.current?.user).toBeNull();
    expect(captured.current?.rolesCarregados).toBe(true);
    expect(captured.current?.roles).toEqual([]);
  });

  it("com sessão: fetcha roles via query (boot cache miss) e seta", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    mockFrom.mockReturnValue(makeRolesChain([ROLE_BRAND]));

    const { captured } = renderWithAuth();
    await waitFor(() => expect(captured.current?.roles).toHaveLength(1));
    expect(captured.current?.user?.id).toBe("u1");
    expect(captured.current?.roles[0].role).toBe("brand_admin");
    expect(mockIdentify).toHaveBeenCalledWith("u1");
  });

  it("boot cache hit: usa roles do bootContext (sem query a user_roles)", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    mockGetBootContext.mockResolvedValue({
      user_id: "u1",
      roles: [ROLE_ROOT],
    });

    const { captured } = renderWithAuth();
    await waitFor(() => expect(captured.current?.roles).toHaveLength(1));
    expect(captured.current?.roles[0].role).toBe("root_admin");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("getSession throw: NÃO crasha provider, rolesCarregados=true", async () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockGetSession.mockRejectedValue(new Error("network"));
    const { captured } = renderWithAuth();
    await waitFor(() => expect(captured.current?.loading).toBe(false));
    expect(captured.current?.rolesCarregados).toBe(true);
    spy.mockRestore();
  });
});

// ────────────────────────────────────────────────────────
// hasRole + isRootAdmin
// ────────────────────────────────────────────────────────
describe("hasRole + isRootAdmin", () => {
  it("hasRole match: true | não match: false", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    mockFrom.mockReturnValue(makeRolesChain([ROLE_BRAND]));

    const { captured } = renderWithAuth();
    await waitFor(() => expect(captured.current?.roles).toHaveLength(1));
    expect(captured.current?.hasRole("brand_admin")).toBe(true);
    expect(captured.current?.hasRole("root_admin")).toBe(false);
  });

  it("isRootAdmin: true só pra role root_admin", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    mockFrom.mockReturnValue(makeRolesChain([ROLE_ROOT, ROLE_BRAND]));

    const { captured } = renderWithAuth();
    await waitFor(() => expect(captured.current?.roles).toHaveLength(2));
    expect(captured.current?.isRootAdmin).toBe(true);
  });

  it("isRootAdmin: false sem role root", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    mockFrom.mockReturnValue(makeRolesChain([ROLE_BRAND]));

    const { captured } = renderWithAuth();
    await waitFor(() => expect(captured.current?.isRootAdmin).toBe(false));
  });
});

// ────────────────────────────────────────────────────────
// signOut voluntário
// ────────────────────────────────────────────────────────
describe("signOut", () => {
  it("limpa queryClient cache + roles + chama supabase.auth.signOut", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    mockFrom.mockReturnValue(makeRolesChain([ROLE_BRAND]));
    mockSignOut.mockResolvedValue({ error: null });

    const { captured, queryClearSpy } = renderWithAuth();
    await waitFor(() => expect(captured.current?.roles).toHaveLength(1));

    await act(async () => {
      await captured.current!.signOut();
    });
    expect(queryClearSpy).toHaveBeenCalled();
    expect(mockSignOut).toHaveBeenCalled();
    expect(captured.current?.roles).toEqual([]);
  });

  it("signOut → SIGNED_OUT: NÃO dispara sessionExpired (logout voluntário)", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    mockFrom.mockReturnValue(makeRolesChain([ROLE_BRAND]));
    mockSignOut.mockResolvedValue({ error: null });

    const { captured } = renderWithAuth();
    await waitFor(() => expect(captured.current?.roles).toHaveLength(1));

    await act(async () => {
      await captured.current!.signOut();
      authStateHandler!("SIGNED_OUT", null);
    });
    expect(captured.current?.sessionExpired).toBe(false);
  });
});

// ────────────────────────────────────────────────────────
// SIGNED_OUT involuntário (sessão expirou)
// ────────────────────────────────────────────────────────
describe("sessão expirada (SIGNED_OUT involuntário)", () => {
  it("após SIGNED_IN + SIGNED_OUT involuntário: sessionExpired=true, returnTo persistido", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockFrom.mockReturnValue(makeRolesChain([]));

    const { captured } = renderWithAuth();
    await waitFor(() => expect(captured.current?.loading).toBe(false));

    // Simula login
    await act(async () => {
      authStateHandler!("SIGNED_IN", SESSION);
    });
    await waitFor(() => expect(captured.current?.user?.id).toBe("u1"));

    // Stub do pathname antes do SIGNED_OUT
    Object.defineProperty(window, "location", {
      writable: true,
      value: { pathname: "/admin/dashboard", search: "?tab=brands", hostname: "x" },
    });

    // Sessão expira (sem signOut() voluntário antes)
    await act(async () => {
      authStateHandler!("SIGNED_OUT", null);
    });
    expect(captured.current?.sessionExpired).toBe(true);
    expect(sessionStorage.getItem(AUTH_RETURN_TO_KEY)).toBe("/admin/dashboard?tab=brands");
  });

  it("dismissSessionExpired: zera flag (usuário fechou dialog)", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockFrom.mockReturnValue(makeRolesChain([]));

    const { captured } = renderWithAuth();
    await waitFor(() => expect(captured.current?.loading).toBe(false));

    await act(async () => {
      authStateHandler!("SIGNED_IN", SESSION);
    });

    Object.defineProperty(window, "location", {
      writable: true,
      value: { pathname: "/admin", search: "", hostname: "x" },
    });

    await act(async () => {
      authStateHandler!("SIGNED_OUT", null);
    });
    expect(captured.current?.sessionExpired).toBe(true);

    act(() => { captured.current!.dismissSessionExpired(); });
    expect(captured.current?.sessionExpired).toBe(false);
  });

  it("SIGNED_OUT sem nunca ter logado (visitante): NÃO dispara dialog", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockFrom.mockReturnValue(makeRolesChain([]));

    const { captured } = renderWithAuth();
    await waitFor(() => expect(captured.current?.loading).toBe(false));

    await act(async () => {
      authStateHandler!("SIGNED_OUT", null);
    });
    expect(captured.current?.sessionExpired).toBe(false);
  });

  it("SIGNED_OUT em /auth*: NÃO persiste returnTo (evita loop)", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockFrom.mockReturnValue(makeRolesChain([]));

    const { captured } = renderWithAuth();
    await waitFor(() => expect(captured.current?.loading).toBe(false));

    await act(async () => {
      authStateHandler!("SIGNED_IN", SESSION);
    });

    Object.defineProperty(window, "location", {
      writable: true,
      value: { pathname: "/auth/login", search: "", hostname: "x" },
    });

    await act(async () => {
      authStateHandler!("SIGNED_OUT", null);
    });
    expect(sessionStorage.getItem(AUTH_RETURN_TO_KEY)).toBeNull();
  });
});

// ────────────────────────────────────────────────────────
// useAuth orphan
// ────────────────────────────────────────────────────────
describe("useAuth orphan", () => {
  it("fora do Provider: throw com mensagem clara", () => {
    function Orphan() {
      useAuth();
      return null;
    }
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() => render(<Orphan />)).toThrow(/useAuth must be used within AuthProvider/);
    } finally {
      spy.mockRestore();
    }
  });
});
