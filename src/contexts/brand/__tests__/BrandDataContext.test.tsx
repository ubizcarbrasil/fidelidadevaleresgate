/**
 * BrandDataContext — fetcha branches do brand resolvido, restaura
 * selected_branch_id do profile, auto-detect por geo após 1.5s (deferred
 * pra não bloquear FCP), persist no profile ao mudar.
 *
 * Bug aqui = branch vaza ao trocar de brand (sem clear), 1 branch só não
 * auto-selecionada (UX morta), geo detect roda em branches sem coords (crash
 * na haversine).
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, act } from "@testing-library/react";

const {
  mockUseAuth,
  mockUseBrandResolver,
  mockFrom,
  mockGetCurrentPosition,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseBrandResolver: vi.fn(),
  mockFrom: vi.fn(),
  mockGetCurrentPosition: vi.fn(),
}));

vi.mock("../../AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../BrandResolverContext", () => ({
  useBrandResolver: () => mockUseBrandResolver(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom },
}));

vi.mock("@/lib/geolocation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/geolocation")>();
  return {
    ...actual,
    getCurrentPosition: mockGetCurrentPosition,
  };
});

import { BrandDataProvider, useBrandData } from "../BrandDataContext";

const BRAND = { id: "b1", name: "Pizza Vale" };

const BRANCH_SP = { id: "sp", brand_id: "b1", name: "São Paulo", latitude: -23.55, longitude: -46.63, is_active: true } as never;
const BRANCH_RJ = { id: "rj", brand_id: "b1", name: "Rio", latitude: -22.91, longitude: -43.17, is_active: true } as never;
const BRANCH_NO_COORDS = { id: "x", brand_id: "b1", name: "Sem Coords", latitude: null, longitude: null, is_active: true } as never;

function Probe({ onCtx }: { onCtx: (ctx: ReturnType<typeof useBrandData>) => void }) {
  const ctx = useBrandData();
  React.useEffect(() => { onCtx(ctx); }, [ctx, onCtx]);
  return null;
}

// Chain helper que multiplexa por tabela + suporta os métodos usados
function makeBranchesChain(branchList: unknown[]) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: branchList }),
  };
}

function makeProfileChain(profile: { selected_branch_id?: string } | null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: profile }),
    update: vi.fn().mockReturnThis(),
  };
}

beforeEach(() => {
  mockUseAuth.mockReset();
  mockUseAuth.mockReturnValue({ user: null });
  mockUseBrandResolver.mockReset();
  mockUseBrandResolver.mockReturnValue({ brand: BRAND });
  mockFrom.mockReset();
  mockGetCurrentPosition.mockReset();
});

// ────────────────────────────────────────────────────────
// Branches fetch
// ────────────────────────────────────────────────────────
describe("BrandDataProvider — fetch branches", () => {
  it("brand null + sem user: branches=[], selectedBranch=null", async () => {
    mockUseBrandResolver.mockReturnValue({ brand: null });
    mockUseAuth.mockReturnValue({ user: null });
    const captured: { current: ReturnType<typeof useBrandData> | null } = { current: null };
    render(
      <BrandDataProvider>
        <Probe onCtx={(c) => { captured.current = c; }} />
      </BrandDataProvider>,
    );
    await waitFor(() => expect(captured.current).not.toBeNull());
    expect(captured.current?.branches).toEqual([]);
    expect(captured.current?.selectedBranch).toBeNull();
  });

  it("1 branch só: auto-seleciona (UX shortcut)", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "branches") return makeBranchesChain([BRANCH_SP]);
      return makeProfileChain(null);
    });
    const captured: { current: ReturnType<typeof useBrandData> | null } = { current: null };
    render(
      <BrandDataProvider>
        <Probe onCtx={(c) => { captured.current = c; }} />
      </BrandDataProvider>,
    );
    await waitFor(() => expect(captured.current?.selectedBranch?.id).toBe("sp"));
    expect(captured.current?.branches).toHaveLength(1);
  });

  it("múltiplas branches + user com selected_branch_id no profile: restaura", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" } });
    mockFrom.mockImplementation((table: string) => {
      if (table === "branches") return makeBranchesChain([BRANCH_SP, BRANCH_RJ]);
      if (table === "profiles") return makeProfileChain({ selected_branch_id: "rj" });
      return makeProfileChain(null);
    });
    const captured: { current: ReturnType<typeof useBrandData> | null } = { current: null };
    render(
      <BrandDataProvider>
        <Probe onCtx={(c) => { captured.current = c; }} />
      </BrandDataProvider>,
    );
    await waitFor(() => expect(captured.current?.selectedBranch?.id).toBe("rj"));
  });

  it("múltiplas + profile aponta pra branch que NÃO existe: selectedBranch fica null (não trava)", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" } });
    mockFrom.mockImplementation((table: string) => {
      if (table === "branches") return makeBranchesChain([BRANCH_SP, BRANCH_RJ]);
      if (table === "profiles") return makeProfileChain({ selected_branch_id: "ghost" });
      return makeProfileChain(null);
    });
    const captured: { current: ReturnType<typeof useBrandData> | null } = { current: null };
    render(
      <BrandDataProvider>
        <Probe onCtx={(c) => { captured.current = c; }} />
      </BrandDataProvider>,
    );
    await waitFor(() => expect(captured.current?.branches).toHaveLength(2));
    expect(captured.current?.selectedBranch).toBeNull();
  });
});

// ────────────────────────────────────────────────────────
// initialBranches (override mode)
// ────────────────────────────────────────────────────────
describe("initialBranches (override mode)", () => {
  it("initialBranches=[só 1]: NÃO fetch, auto-seleciona", async () => {
    const captured: { current: ReturnType<typeof useBrandData> | null } = { current: null };
    render(
      <BrandDataProvider initialBranches={[BRANCH_SP]}>
        <Probe onCtx={(c) => { captured.current = c; }} />
      </BrandDataProvider>,
    );
    await waitFor(() => expect(captured.current?.selectedBranch?.id).toBe("sp"));
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("initialBranches múltiplas + user: restaura selected do profile", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" } });
    mockFrom.mockReturnValue(makeProfileChain({ selected_branch_id: "rj" }));

    const captured: { current: ReturnType<typeof useBrandData> | null } = { current: null };
    render(
      <BrandDataProvider initialBranches={[BRANCH_SP, BRANCH_RJ]}>
        <Probe onCtx={(c) => { captured.current = c; }} />
      </BrandDataProvider>,
    );
    await waitFor(() => expect(captured.current?.selectedBranch?.id).toBe("rj"));
  });
});

// ────────────────────────────────────────────────────────
// detectBranchByLocation (sob demanda)
// ────────────────────────────────────────────────────────
describe("detectBranchByLocation", () => {
  it("branches sem coords: retorna null sem chamar geo", async () => {
    const captured: { current: ReturnType<typeof useBrandData> | null } = { current: null };
    render(
      <BrandDataProvider initialBranches={[BRANCH_NO_COORDS]}>
        <Probe onCtx={(c) => { captured.current = c; }} />
      </BrandDataProvider>,
    );
    await waitFor(() => expect(captured.current).not.toBeNull());

    const result = await captured.current!.detectBranchByLocation();
    expect(result).toBeNull();
    expect(mockGetCurrentPosition).not.toHaveBeenCalled();
  });

  it("geo retorna null (permissão negada): null", async () => {
    mockGetCurrentPosition.mockResolvedValue(null);
    const captured: { current: ReturnType<typeof useBrandData> | null } = { current: null };
    render(
      <BrandDataProvider initialBranches={[BRANCH_SP, BRANCH_RJ]}>
        <Probe onCtx={(c) => { captured.current = c; }} />
      </BrandDataProvider>,
    );
    await waitFor(() => expect(captured.current).not.toBeNull());

    const result = await captured.current!.detectBranchByLocation();
    expect(result).toBeNull();
  });

  it("geo retorna coords: retorna branch mais próxima", async () => {
    mockGetCurrentPosition.mockResolvedValue({ latitude: -23.5, longitude: -46.6 }); // SP
    const captured: { current: ReturnType<typeof useBrandData> | null } = { current: null };
    render(
      <BrandDataProvider initialBranches={[BRANCH_SP, BRANCH_RJ]}>
        <Probe onCtx={(c) => { captured.current = c; }} />
      </BrandDataProvider>,
    );
    await waitFor(() => expect(captured.current).not.toBeNull());

    const result = await captured.current!.detectBranchByLocation();
    expect(result?.id).toBe("sp");
  });
});

// ────────────────────────────────────────────────────────
// setSelectedBranch
// ────────────────────────────────────────────────────────
describe("setSelectedBranch", () => {
  it("sem user: muda state local sem chamar update", async () => {
    const captured: { current: ReturnType<typeof useBrandData> | null } = { current: null };
    render(
      <BrandDataProvider initialBranches={[BRANCH_SP, BRANCH_RJ]}>
        <Probe onCtx={(c) => { captured.current = c; }} />
      </BrandDataProvider>,
    );
    await waitFor(() => expect(captured.current).not.toBeNull());

    await act(async () => {
      await captured.current!.setSelectedBranch(BRANCH_RJ);
    });
    expect(captured.current?.selectedBranch?.id).toBe("rj");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("com user: persiste no profile", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" } });
    const updateChain = makeProfileChain(null);
    // Para os 2 effects iniciais, profile chain retorna null (sem selected salvo)
    mockFrom.mockReturnValue(updateChain);

    const captured: { current: ReturnType<typeof useBrandData> | null } = { current: null };
    render(
      <BrandDataProvider initialBranches={[BRANCH_SP, BRANCH_RJ]}>
        <Probe onCtx={(c) => { captured.current = c; }} />
      </BrandDataProvider>,
    );
    await waitFor(() => expect(captured.current).not.toBeNull());

    await act(async () => {
      await captured.current!.setSelectedBranch(BRANCH_RJ);
    });
    expect(captured.current?.selectedBranch?.id).toBe("rj");
    // update chamado (entre outros: profile select + update)
    expect(updateChain.update).toHaveBeenCalledWith({ selected_branch_id: "rj" });
  });
});

// ────────────────────────────────────────────────────────
// orphan
// ────────────────────────────────────────────────────────
describe("useBrandData orphan", () => {
  it("fora do Provider: throw com mensagem clara", () => {
    function Orphan() {
      useBrandData();
      return null;
    }
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() => render(<Orphan />)).toThrow(/useBrandData must be used within BrandDataProvider/);
    } finally {
      spy.mockRestore();
    }
  });
});
