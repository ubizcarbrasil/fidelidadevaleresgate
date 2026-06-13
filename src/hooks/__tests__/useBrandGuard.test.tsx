/**
 * useBrandGuard — central de permissioning multi-tenant.
 *
 * Bug aqui = vazamento cross-tenant. 109 componentes consomem este hook
 * pra decidir queries, filtros, e enforcement de brand_id/branch_id em
 * inserts/updates. Testes cobrem todos os caminhos de derivação +
 * enforcement defensivo.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { useBrandGuard } from "../useBrandGuard";

// ── Mocks ────────────────────────────────────────────────
// AuthContext.useAuth controlado por mockAuthState (mutável entre testes).
type MockRole = {
  role: string;
  brand_id?: string | null;
  branch_id?: string | null;
};
const mockAuthState: {
  isRootAdmin: boolean;
  roles: MockRole[];
  loading: boolean;
  user: { id: string } | null;
  rolesCarregados: boolean;
} = {
  isRootAdmin: false,
  roles: [],
  loading: false,
  user: { id: "u1" },
  rolesCarregados: true,
};
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

const mockBrandState: { brand: { id: string; name?: string } | null } = {
  brand: null,
};
vi.mock("@/contexts/BrandContext", () => ({
  useBrand: () => mockBrandState,
}));

function wrap(initialSearch = ""): { wrapper: (p: { children: ReactNode }) => JSX.Element } {
  return {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[`/${initialSearch ? "?" + initialSearch : ""}`]}>
        {children}
      </MemoryRouter>
    ),
  };
}

function reset() {
  mockAuthState.isRootAdmin = false;
  mockAuthState.roles = [];
  mockAuthState.loading = false;
  mockAuthState.user = { id: "u1" };
  mockAuthState.rolesCarregados = true;
  mockBrandState.brand = null;
}

beforeEach(reset);

// ── currentBrandId ───────────────────────────────────────
describe("currentBrandId", () => {
  it("root admin com brand no contexto → usa brand.id direto", () => {
    mockAuthState.isRootAdmin = true;
    mockBrandState.brand = { id: "brand-x" };
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.currentBrandId).toBe("brand-x");
  });

  it("non-root com brand E role nessa brand → usa brand.id", () => {
    mockBrandState.brand = { id: "brand-y" };
    mockAuthState.roles = [{ role: "brand_admin", brand_id: "brand-y" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.currentBrandId).toBe("brand-y");
  });

  it("non-root com brand mas SEM role nela → cai pra brand do role", () => {
    // Defesa: brand context resolvido pelo subdomain pode não ser do user.
    mockBrandState.brand = { id: "brand-NOTROLE" };
    mockAuthState.roles = [{ role: "brand_admin", brand_id: "brand-OWN" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.currentBrandId).toBe("brand-OWN");
  });

  it("sem brand context → usa primeira role com brand_id", () => {
    mockAuthState.roles = [
      { role: "store_admin" },
      { role: "brand_admin", brand_id: "brand-Z" },
    ];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.currentBrandId).toBe("brand-Z");
  });

  it("sem brand context e sem role com brand_id → null", () => {
    mockAuthState.roles = [{ role: "store_admin" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.currentBrandId).toBeNull();
  });

  it("non-root NÃO ganha brand_id de root.brand sem role", () => {
    // CRÍTICO: se isRootAdmin=false, brand context sozinho não basta.
    // Evita que session de admin de outra brand acidentalmente acesse
    // tenant errado por causa do subdomain.
    mockBrandState.brand = { id: "brand-OUTRO" };
    mockAuthState.roles = [];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.currentBrandId).toBeNull();
  });
});

// ── currentBranchId ──────────────────────────────────────
describe("currentBranchId", () => {
  it("retorna branch_id da primeira role que tem", () => {
    mockAuthState.roles = [
      { role: "brand_admin", brand_id: "b1" },
      { role: "branch_admin", brand_id: "b1", branch_id: "branch-A" },
    ];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.currentBranchId).toBe("branch-A");
  });

  it("retorna null se nenhuma role tem branch_id", () => {
    mockAuthState.roles = [{ role: "brand_admin", brand_id: "b1" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.currentBranchId).toBeNull();
  });
});

// ── applyBrandFilter ─────────────────────────────────────
describe("applyBrandFilter", () => {
  function makeQuery() {
    const calls: Array<[string, string]> = [];
    const builder: any = {
      eq: (col: string, val: string) => {
        calls.push([col, val]);
        return builder;
      },
    };
    return { builder, calls };
  }

  it("non-root: força eq('brand_id', currentBrandId)", () => {
    mockAuthState.roles = [{ role: "brand_admin", brand_id: "brand-X" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    const { builder, calls } = makeQuery();
    result.current.applyBrandFilter(builder);
    expect(calls).toEqual([["brand_id", "brand-X"]]);
  });

  it("non-root sem brand: NÃO aplica filtro (deixa RLS bloquear)", () => {
    mockAuthState.roles = [];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    const { builder, calls } = makeQuery();
    result.current.applyBrandFilter(builder);
    expect(calls).toEqual([]);
  });

  it("root admin sem override: NÃO filtra (vê tudo)", () => {
    mockAuthState.isRootAdmin = true;
    const { result } = renderHook(() => useBrandGuard(), wrap());
    const { builder, calls } = makeQuery();
    result.current.applyBrandFilter(builder);
    expect(calls).toEqual([]);
  });

  it("root admin com override: usa o override", () => {
    mockAuthState.isRootAdmin = true;
    const { result } = renderHook(() => useBrandGuard(), wrap());
    const { builder, calls } = makeQuery();
    result.current.applyBrandFilter(builder, "brand-FORCED");
    expect(calls).toEqual([["brand_id", "brand-FORCED"]]);
  });

  it("non-root: IGNORA override (não pode pular do próprio brand)", () => {
    // CRÍTICO: senão um brand_admin malicioso passaria override=outro_brand
    // e veria dados de outro tenant.
    mockAuthState.roles = [{ role: "brand_admin", brand_id: "brand-A" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    const { builder, calls } = makeQuery();
    result.current.applyBrandFilter(builder, "brand-MALICIOSO");
    expect(calls).toEqual([["brand_id", "brand-A"]]);
  });
});

// ── applyBranchFilter ────────────────────────────────────
describe("applyBranchFilter", () => {
  function makeQuery() {
    const calls: Array<[string, string]> = [];
    const builder: any = {
      eq: (col: string, val: string) => { calls.push([col, val]); return builder; },
    };
    return { builder, calls };
  }

  it("non-root com branch: força filtro", () => {
    mockAuthState.roles = [{
      role: "branch_admin", brand_id: "b1", branch_id: "br-1",
    }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    const { builder, calls } = makeQuery();
    result.current.applyBranchFilter(builder);
    expect(calls).toEqual([["branch_id", "br-1"]]);
  });

  it("root admin com override: usa override", () => {
    mockAuthState.isRootAdmin = true;
    const { result } = renderHook(() => useBrandGuard(), wrap());
    const { builder, calls } = makeQuery();
    result.current.applyBranchFilter(builder, "branch-X");
    expect(calls).toEqual([["branch_id", "branch-X"]]);
  });

  it("non-root sem branch: não filtra", () => {
    mockAuthState.roles = [{ role: "brand_admin", brand_id: "b1" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    const { builder, calls } = makeQuery();
    result.current.applyBranchFilter(builder);
    expect(calls).toEqual([]);
  });
});

// ── enforceBrandId / enforceBranchId ─────────────────────
describe("enforceBrandId", () => {
  it("non-root: adiciona brand_id no payload", () => {
    mockAuthState.roles = [{ role: "brand_admin", brand_id: "b-1" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.enforceBrandId({ name: "X" })).toEqual({
      name: "X",
      brand_id: "b-1",
    });
  });

  it("non-root: SOBRESCREVE brand_id passado no payload (defesa)", () => {
    mockAuthState.roles = [{ role: "brand_admin", brand_id: "b-OWN" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(
      result.current.enforceBrandId({ name: "X", brand_id: "b-OUTRO" }),
    ).toEqual({ name: "X", brand_id: "b-OWN" });
  });

  it("root admin: passa payload sem alteração", () => {
    mockAuthState.isRootAdmin = true;
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(
      result.current.enforceBrandId({ name: "X", brand_id: "qualquer" }),
    ).toEqual({ name: "X", brand_id: "qualquer" });
  });
});

describe("enforceBranchId", () => {
  it("non-root com branch: adiciona/sobrescreve branch_id", () => {
    mockAuthState.roles = [{
      role: "branch_admin", brand_id: "b1", branch_id: "br-X",
    }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(
      result.current.enforceBranchId({ x: 1, branch_id: "br-OUTRO" }),
    ).toEqual({ x: 1, branch_id: "br-X" });
  });

  it("non-root sem branch: payload inalterado", () => {
    mockAuthState.roles = [{ role: "brand_admin", brand_id: "b1" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.enforceBranchId({ x: 1 })).toEqual({ x: 1 });
  });
});

// ── consoleScope ─────────────────────────────────────────
describe("consoleScope", () => {
  it("LOADING quando auth ainda carregando", () => {
    mockAuthState.loading = true;
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.consoleScope).toBe("LOADING");
  });

  it("LOADING quando user existe mas roles ainda não carregaram", () => {
    mockAuthState.rolesCarregados = false;
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.consoleScope).toBe("LOADING");
  });

  it("ROOT pra root_admin sem impersonate", () => {
    mockAuthState.isRootAdmin = true;
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.consoleScope).toBe("ROOT");
  });

  it("BRAND pra root_admin impersonating via ?brandId=", () => {
    mockAuthState.isRootAdmin = true;
    mockBrandState.brand = { id: "brand-X" };
    const { result } = renderHook(() => useBrandGuard(), wrap("brandId=brand-X"));
    expect(result.current.consoleScope).toBe("BRAND");
  });

  it("ROOT pra root_admin com ?brandId= mas brand context vazio", () => {
    // Edge case: impersonate flag presente mas brand não resolveu ainda
    mockAuthState.isRootAdmin = true;
    mockBrandState.brand = null;
    const { result } = renderHook(() => useBrandGuard(), wrap("brandId=brand-X"));
    expect(result.current.consoleScope).toBe("ROOT");
  });

  it("TENANT pra tenant_admin", () => {
    mockAuthState.roles = [{ role: "tenant_admin" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.consoleScope).toBe("TENANT");
  });

  it("BRAND pra brand_admin", () => {
    mockAuthState.roles = [{ role: "brand_admin", brand_id: "b1" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.consoleScope).toBe("BRAND");
  });

  it("BRANCH pra branch_admin", () => {
    mockAuthState.roles = [{ role: "branch_admin", brand_id: "b1", branch_id: "br1" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.consoleScope).toBe("BRANCH");
  });

  it("OPERATOR pra branch_operator", () => {
    mockAuthState.roles = [{ role: "branch_operator", brand_id: "b1", branch_id: "br1" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.consoleScope).toBe("OPERATOR");
  });

  it("OPERATOR pra operator_pdv", () => {
    mockAuthState.roles = [{ role: "operator_pdv", brand_id: "b1" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.consoleScope).toBe("OPERATOR");
  });

  it("STORE_ADMIN pra store_admin", () => {
    mockAuthState.roles = [{ role: "store_admin", brand_id: "b1" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.consoleScope).toBe("STORE_ADMIN");
  });

  it("hierarquia: brand_admin vence se user tem várias roles", () => {
    mockAuthState.roles = [
      { role: "store_admin", brand_id: "b1" },
      { role: "brand_admin", brand_id: "b1" },
    ];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.consoleScope).toBe("BRAND");
  });

  it("fallback BRANCH quando user sem roles conhecidas", () => {
    mockAuthState.roles = [{ role: "qualquer_outra" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.consoleScope).toBe("BRANCH");
  });
});

// ── Identidade estável ───────────────────────────────────
describe("memoização", () => {
  it("retorna o mesmo objeto entre renders com state idêntico", () => {
    mockAuthState.roles = [{ role: "brand_admin", brand_id: "b1" }];
    const { result, rerender } = renderHook(() => useBrandGuard(), wrap());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
