import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// ── Supabase Mock Factory ────────────────────────────────────────────
// Usage in tests:
//   import { createMockSupabase } from "@/test/setup";
//   vi.mock("@/integrations/supabase/client", () => ({
//     supabase: createMockSupabase({ ... })
//   }));

export interface MockQueryResult {
  data?: any;
  error?: any;
  count?: number;
}

export function createMockQueryBuilder(result: MockQueryResult = { data: [], error: null }) {
  const builder: any = {};
  const chainMethods = [
    "select", "insert", "update", "delete", "upsert",
    "eq", "neq", "gt", "gte", "lt", "lte",
    "like", "ilike", "or", "and",
    "in", "is", "not",
    "order", "limit", "range",
    "single", "maybeSingle",
  ];

  chainMethods.forEach((method) => {
    builder[method] = vi.fn().mockReturnValue(builder);
  });

  // Terminal methods that resolve
  builder.then = vi.fn((resolve: any) => resolve(result));

  // Make it thenable so await works
  const promise = Promise.resolve(result);
  builder.then = promise.then.bind(promise);
  builder.catch = promise.catch.bind(promise);

  return builder;
}

export function createMockSupabase(overrides: Record<string, MockQueryResult> = {}) {
  return {
    from: vi.fn((table: string) => {
      const result = overrides[table] || { data: [], error: null };
      return createMockQueryBuilder(result);
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
  };
}
