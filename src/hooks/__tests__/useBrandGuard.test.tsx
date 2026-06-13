/**
 * useBrandGuard — central de permissioning multi-tenant.
 *
 * Bug aqui = vazamento cross-tenant. 109 componentes consomem este hook
 * pra decidir queries, filtros, e enforcement de brand_id/branch_id em
 * inserts/updates. Testes cobrem todos os caminhos de derivação +
 * enforcement defensivo.
 *
 * Setup migrado pra mock harness consolidado em PR #82:
 *   import { createMockAuth, createMockBrand } from "@/test/mocks/context"
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { useBrandGuard } from "../useBrandGuard";
import { createMockAuth, createMockBrand } from "@/test/mocks/context";

// ── Mocks consolidados ───────────────────────────────────
const mockAuth = createMockAuth();
const mockBrand = createMockBrand();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuth.state,
}));
vi.mock("@/contexts/BrandContext", () => ({
  useBrand: () => mockBrand.state,
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

beforeEach(() => {
  mockAuth.reset();
  mockBrand.reset();
});

// ── currentBrandId ───────────────────────────────────────
describe("currentBrandId", () => {
  it("root admin com brand no contexto → usa brand.id direto", () => {
    mockAuth.state.isRootAdmin = true;
    mockBrand.state.brand = { id: "brand-x" };
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.currentBrandId).toBe("brand-x");
  });

  it("non-root com brand E role nessa brand → usa brand.id", () => {
    mockBrand.state.brand = { id: "brand-y" };
    mockAuth.state.roles = [{ role: "brand_admin", brand_id: "brand-y" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.currentBrandId).toBe("brand-y");
  });

  it("non-root com brand mas SEM role nela → cai pra brand do role", () => {
    // Defesa: brand context resolvido pelo subdomain pode não ser do user.
    mockBrand.state.brand = { id: "brand-NOTROLE" };
    mockAuth.state.roles = [{ role: "brand_admin", brand_id: "brand-OWN" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.currentBrandId).toBe("brand-OWN");
  });

  it("sem brand context → usa primeira role com brand_id", () => {
    mockAuth.state.roles = [
      { role: "store_admin" },
      { role: "brand_admin", brand_id: "brand-Z" },
    ];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.currentBrandId).toBe("brand-Z");
  });

  it("sem brand context e sem role com brand_id → null", () => {
    mockAuth.state.roles = [{ role: "store_admin" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.currentBrandId).toBeNull();
  });

  it("non-root NÃO ganha brand_id de root.brand sem role", () => {
    // CRÍTICO: se isRootAdmin=false, brand context sozinho não basta.
    // Evita que session de admin de outra brand acidentalmente acesse
    // tenant errado por causa do subdomain.
    mockBrand.state.brand = { id: "brand-OUTRO" };
    mockAuth.state.roles = [];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.currentBrandId).toBeNull();
  });
});

// ── currentBranchId ──────────────────────────────────────
describe("currentBranchId", () => {
  it("retorna branch_id da primeira role que tem", () => {
    mockAuth.state.roles = [
      { role: "brand_admin", brand_id: "b1" },
      { role: "branch_admin", brand_id: "b1", branch_id: "branch-A" },
    ];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.currentBranchId).toBe("branch-A");
  });

  it("retorna null se nenhuma role tem branch_id", () => {
    mockAuth.state.roles = [{ role: "brand_admin", brand_id: "b1" }];
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
    mockAuth.state.roles = [{ role: "brand_admin", brand_id: "brand-X" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    const { builder, calls } = makeQuery();
    result.current.applyBrandFilter(builder);
    expect(calls).toEqual([["brand_id", "brand-X"]]);
  });

  it("non-root sem brand: NÃO aplica filtro (deixa RLS bloquear)", () => {
    mockAuth.state.roles = [];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    const { builder, calls } = makeQuery();
    result.current.applyBrandFilter(builder);
    expect(calls).toEqual([]);
  });

  it("root admin sem override: NÃO filtra (vê tudo)", () => {
    mockAuth.state.isRootAdmin = true;
    const { result } = renderHook(() => useBrandGuard(), wrap());
    const { builder, calls } = makeQuery();
    result.current.applyBrandFilter(builder);
    expect(calls).toEqual([]);
  });

  it("root admin com override: usa o override", () => {
    mockAuth.state.isRootAdmin = true;
    const { result } = renderHook(() => useBrandGuard(), wrap());
    const { builder, calls } = makeQuery();
    result.current.applyBrandFilter(builder, "brand-FORCED");
    expect(calls).toEqual([["brand_id", "brand-FORCED"]]);
  });

  it("non-root: IGNORA override (não pode pular do próprio brand)", () => {
    // CRÍTICO: senão um brand_admin malicioso passaria override=outro_brand
    // e veria dados de outro tenant.
    mockAuth.state.roles = [{ role: "brand_admin", brand_id: "brand-A" }];
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
    mockAuth.state.roles = [{
      role: "branch_admin", brand_id: "b1", branch_id: "br-1",
    }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    const { builder, calls } = makeQuery();
    result.current.applyBranchFilter(builder);
    expect(calls).toEqual([["branch_id", "br-1"]]);
  });

  it("root admin com override: usa override", () => {
    mockAuth.state.isRootAdmin = true;
    const { result } = renderHook(() => useBrandGuard(), wrap());
    const { builder, calls } = makeQuery();
    result.current.applyBranchFilter(builder, "branch-X");
    expect(calls).toEqual([["branch_id", "branch-X"]]);
  });

  it("non-root sem branch: não filtra", () => {
    mockAuth.state.roles = [{ role: "brand_admin", brand_id: "b1" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    const { builder, calls } = makeQuery();
    result.current.applyBranchFilter(builder);
    expect(calls).toEqual([]);
  });
});

// ── enforceBrandId / enforceBranchId ─────────────────────
describe("enforceBrandId", () => {
  it("non-root: adiciona brand_id no payload", () => {
    mockAuth.state.roles = [{ role: "brand_admin", brand_id: "b-1" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.enforceBrandId({ name: "X" })).toEqual({
      name: "X",
      brand_id: "b-1",
    });
  });

  it("non-root: SOBRESCREVE brand_id passado no payload (defesa)", () => {
    mockAuth.state.roles = [{ role: "brand_admin", brand_id: "b-OWN" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(
      result.current.enforceBrandId({ name: "X", brand_id: "b-OUTRO" }),
    ).toEqual({ name: "X", brand_id: "b-OWN" });
  });

  it("root admin: passa payload sem alteração", () => {
    mockAuth.state.isRootAdmin = true;
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(
      result.current.enforceBrandId({ name: "X", brand_id: "qualquer" }),
    ).toEqual({ name: "X", brand_id: "qualquer" });
  });
});

describe("enforceBranchId", () => {
  it("non-root com branch: adiciona/sobrescreve branch_id", () => {
    mockAuth.state.roles = [{
      role: "branch_admin", brand_id: "b1", branch_id: "br-X",
    }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(
      result.current.enforceBranchId({ x: 1, branch_id: "br-OUTRO" }),
    ).toEqual({ x: 1, branch_id: "br-X" });
  });

  it("non-root sem branch: payload inalterado", () => {
    mockAuth.state.roles = [{ role: "brand_admin", brand_id: "b1" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.enforceBranchId({ x: 1 })).toEqual({ x: 1 });
  });
});

// ── consoleScope ─────────────────────────────────────────
describe("consoleScope", () => {
  it("LOADING quando auth ainda carregando", () => {
    mockAuth.state.loading = true;
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.consoleScope).toBe("LOADING");
  });

  it("LOADING quando user existe mas roles ainda não carregaram", () => {
    mockAuth.state.rolesCarregados = false;
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.consoleScope).toBe("LOADING");
  });

  it("ROOT pra root_admin sem impersonate", () => {
    mockAuth.state.isRootAdmin = true;
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.consoleScope).toBe("ROOT");
  });

  it("BRAND pra root_admin impersonating via ?brandId=", () => {
    mockAuth.state.isRootAdmin = true;
    mockBrand.state.brand = { id: "brand-X" };
    const { result } = renderHook(() => useBrandGuard(), wrap("brandId=brand-X"));
    expect(result.current.consoleScope).toBe("BRAND");
  });

  it("ROOT pra root_admin com ?brandId= mas brand context vazio", () => {
    // Edge case: impersonate flag presente mas brand não resolveu ainda
    mockAuth.state.isRootAdmin = true;
    mockBrand.state.brand = null;
    const { result } = renderHook(() => useBrandGuard(), wrap("brandId=brand-X"));
    expect(result.current.consoleScope).toBe("ROOT");
  });

  it("TENANT pra tenant_admin", () => {
    mockAuth.state.roles = [{ role: "tenant_admin" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.consoleScope).toBe("TENANT");
  });

  it("BRAND pra brand_admin", () => {
    mockAuth.state.roles = [{ role: "brand_admin", brand_id: "b1" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.consoleScope).toBe("BRAND");
  });

  it("BRANCH pra branch_admin", () => {
    mockAuth.state.roles = [{ role: "branch_admin", brand_id: "b1", branch_id: "br1" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.consoleScope).toBe("BRANCH");
  });

  it("OPERATOR pra branch_operator", () => {
    mockAuth.state.roles = [{ role: "branch_operator", brand_id: "b1", branch_id: "br1" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.consoleScope).toBe("OPERATOR");
  });

  it("OPERATOR pra operator_pdv", () => {
    mockAuth.state.roles = [{ role: "operator_pdv", brand_id: "b1" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.consoleScope).toBe("OPERATOR");
  });

  it("STORE_ADMIN pra store_admin", () => {
    mockAuth.state.roles = [{ role: "store_admin", brand_id: "b1" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.consoleScope).toBe("STORE_ADMIN");
  });

  it("hierarquia: brand_admin vence se user tem várias roles", () => {
    mockAuth.state.roles = [
      { role: "store_admin", brand_id: "b1" },
      { role: "brand_admin", brand_id: "b1" },
    ];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.consoleScope).toBe("BRAND");
  });

  it("fallback BRANCH quando user sem roles conhecidas", () => {
    mockAuth.state.roles = [{ role: "qualquer_outra" }];
    const { result } = renderHook(() => useBrandGuard(), wrap());
    expect(result.current.consoleScope).toBe("BRANCH");
  });
});

// ── Identidade estável ───────────────────────────────────
describe("memoização", () => {
  it("retorna o mesmo objeto entre renders com state idêntico", () => {
    mockAuth.state.roles = [{ role: "brand_admin", brand_id: "b1" }];
    const { result, rerender } = renderHook(() => useBrandGuard(), wrap());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
