/**
 * Mock factories pra contexts/hooks usados por componentes de teste.
 *
 * Padrão: cada factory expõe um state mutável (defaults razoáveis) +
 * funções que leem do state. Testes podem mutar pra simular cenários
 * sem recriar mocks do zero.
 *
 * Uso:
 *   import { createMockAuth, createMockBrand } from "@/test/mocks/context";
 *
 *   const auth = createMockAuth();
 *   vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth.state }));
 *
 *   // No teste:
 *   beforeEach(() => auth.reset());
 *   it("...", () => {
 *     auth.state.isRootAdmin = true;
 *     ...
 *   });
 *
 * Consolidação de padrões repetidos em:
 *   - src/hooks/__tests__/useBrandGuard.test.tsx (PR #74)
 *   - src/pages/__tests__/AuthFlow.e2e.test.tsx (PR #71)
 *   - futuros testes de hooks
 */
import type { ReactNode } from "react";

// ── Auth ─────────────────────────────────────────────────
export interface MockRole {
  role: string;
  brand_id?: string | null;
  branch_id?: string | null;
  tenant_id?: string | null;
}

export interface MockAuthState {
  isRootAdmin: boolean;
  roles: MockRole[];
  loading: boolean;
  user: { id: string; email?: string } | null;
  rolesCarregados: boolean;
  session: unknown | null;
  /** Por padrão é um stub vi.fn — testes podem override no setup. */
  signOut: () => Promise<void>;
}

export interface MockAuthHandle {
  state: MockAuthState;
  reset: () => void;
}

function defaultAuthState(): MockAuthState {
  return {
    isRootAdmin: false,
    roles: [],
    loading: false,
    user: { id: "u1" },
    rolesCarregados: true,
    session: null,
    signOut: async () => {},
  };
}

export function createMockAuth(overrides: Partial<MockAuthState> = {}): MockAuthHandle {
  const state = { ...defaultAuthState(), ...overrides };
  return {
    state,
    reset() {
      Object.assign(state, defaultAuthState(), overrides);
    },
  };
}

// ── Brand ────────────────────────────────────────────────
export interface MockBrand {
  id: string;
  name?: string;
  slug?: string | null;
  brand_settings_json?: Record<string, unknown>;
}

export interface MockBrandState {
  brand: MockBrand | null;
  loading: boolean;
  isWhiteLabel: boolean;
  theme: Record<string, unknown> | null;
  branches: unknown[];
  selectedBranch: unknown | null;
}

export interface MockBrandHandle {
  state: MockBrandState;
  reset: () => void;
}

function defaultBrandState(): MockBrandState {
  return {
    brand: null,
    loading: false,
    isWhiteLabel: false,
    theme: null,
    branches: [],
    selectedBranch: null,
  };
}

export function createMockBrand(overrides: Partial<MockBrandState> = {}): MockBrandHandle {
  const state = { ...defaultBrandState(), ...overrides };
  return {
    state,
    reset() {
      Object.assign(state, defaultBrandState(), overrides);
    },
  };
}

// ── Convenience: tipo de wrapper React Router pra renderHook ─
/**
 * Tipo do return de helpers de wrapper. Implementação fica nos arquivos
 * de teste pra não puxar React Router como dep do shared mocks.
 */
export interface RouterWrapperHelpers {
  wrapper: (props: { children: ReactNode }) => JSX.Element;
}
