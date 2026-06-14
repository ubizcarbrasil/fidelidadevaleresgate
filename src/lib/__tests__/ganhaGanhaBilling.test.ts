/**
 * ganhaGanhaBilling — registra evento de cobrança após earn/redeem.
 *
 * Bug aqui = receita errada. Particularmente:
 *   - Brand sem ganha_ganha_config: deveria não-cobrar; bug = cobra
 *   - fee_mode CUSTOM: deveria usar fee por store; bug = usa global
 *   - period_month em UTC: cobrança no mês errado em 31/MM 23h Brasil
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFrom, mockMaybeSingle, mockInsert } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockMaybeSingle: vi.fn(),
  mockInsert: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom },
}));

vi.mock("@/lib/dateTz", () => ({
  yearMonthInTz: () => "2026-05",
}));

import { recordGanhaGanhaBillingEvent } from "../ganhaGanhaBilling";

beforeEach(() => {
  mockFrom.mockReset();
  mockMaybeSingle.mockReset();
  mockInsert.mockReset();
  mockInsert.mockResolvedValue({ error: null });
});

/**
 * Chain builder: from(table).select(cols).eq(...).maybeSingle()
 * OU from(table).insert(row)
 */
function makeReadChain(maybeSingleResult: unknown) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.maybeSingle = vi.fn().mockResolvedValue(maybeSingleResult);
  return chain;
}

describe("recordGanhaGanhaBillingEvent — guarda", () => {
  it("módulo INATIVO (config null): NÃO insere billing event", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "ganha_ganha_config") return makeReadChain({ data: null });
      return { insert: mockInsert };
    });

    await recordGanhaGanhaBillingEvent({
      brandId: "b1", storeId: "s1", eventType: "EARN",
      pointsAmount: 10, referenceId: "e1", referenceType: "EARNING_EVENT",
    });

    expect(mockInsert).not.toHaveBeenCalled();
  });
});

describe("recordGanhaGanhaBillingEvent — fee FIXED", () => {
  beforeEach(() => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "ganha_ganha_config") {
        return makeReadChain({
          data: {
            is_active: true,
            fee_per_point_earned: 0.02,
            fee_per_point_redeemed: 0.05,
            fee_mode: "FIXED",
          },
        });
      }
      if (table === "ganha_ganha_billing_events") {
        return { insert: mockInsert };
      }
      return makeReadChain({ data: null });
    });
  });

  it("EARN com 10 pontos: fee_total = 10 * 0.02 = 0.20", async () => {
    await recordGanhaGanhaBillingEvent({
      brandId: "b1", storeId: "s1", eventType: "EARN",
      pointsAmount: 10, referenceId: "e1", referenceType: "EARNING_EVENT",
    });

    expect(mockInsert).toHaveBeenCalledOnce();
    const row = mockInsert.mock.calls[0][0];
    expect(row.event_type).toBe("EARN");
    expect(row.points_amount).toBe(10);
    expect(row.fee_per_point).toBe(0.02);
    expect(row.fee_total).toBeCloseTo(0.2, 5);
  });

  it("REDEEM com 20 pontos: fee_total = 20 * 0.05 = 1.00", async () => {
    await recordGanhaGanhaBillingEvent({
      brandId: "b1", storeId: "s1", eventType: "REDEEM",
      pointsAmount: 20, referenceId: "r1", referenceType: "REDEMPTION",
    });

    const row = mockInsert.mock.calls[0][0];
    expect(row.fee_per_point).toBe(0.05);
    expect(row.fee_total).toBeCloseTo(1.0, 5);
  });

  it("period_month vem do yearMonthInTz (timezone-aware)", async () => {
    await recordGanhaGanhaBillingEvent({
      brandId: "b1", storeId: "s1", eventType: "EARN",
      pointsAmount: 1, referenceId: "e", referenceType: "EARNING_EVENT",
    });
    expect(mockInsert.mock.calls[0][0].period_month).toBe("2026-05");
  });

  it("payload preserva brandId / storeId / referenceId / referenceType", async () => {
    await recordGanhaGanhaBillingEvent({
      brandId: "brand-X", storeId: "store-Y", eventType: "EARN",
      pointsAmount: 5, referenceId: "ref-Z", referenceType: "EARNING_EVENT",
    });
    const row = mockInsert.mock.calls[0][0];
    expect(row).toMatchObject({
      brand_id: "brand-X",
      store_id: "store-Y",
      reference_id: "ref-Z",
      reference_type: "EARNING_EVENT",
    });
  });
});

describe("recordGanhaGanhaBillingEvent — fee CUSTOM (por store)", () => {
  it("CUSTOM com store_fee definido: usa fee da store, não global", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "ganha_ganha_config") {
        return makeReadChain({
          data: {
            is_active: true,
            fee_per_point_earned: 0.10, // global "alto"
            fee_per_point_redeemed: 0.20,
            fee_mode: "CUSTOM",
          },
        });
      }
      if (table === "ganha_ganha_store_fees") {
        return makeReadChain({
          data: {
            fee_per_point_earned: 0.01, // store negociou taxa menor
            fee_per_point_redeemed: 0.03,
          },
        });
      }
      if (table === "ganha_ganha_billing_events") {
        return { insert: mockInsert };
      }
      return makeReadChain({ data: null });
    });

    await recordGanhaGanhaBillingEvent({
      brandId: "b1", storeId: "s-custom", eventType: "EARN",
      pointsAmount: 10, referenceId: "e", referenceType: "EARNING_EVENT",
    });

    const row = mockInsert.mock.calls[0][0];
    expect(row.fee_per_point).toBe(0.01);
    expect(row.fee_total).toBeCloseTo(0.1, 5);
  });

  it("CUSTOM sem store_fee (fallback): usa fee global", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "ganha_ganha_config") {
        return makeReadChain({
          data: {
            is_active: true,
            fee_per_point_earned: 0.10,
            fee_per_point_redeemed: 0.20,
            fee_mode: "CUSTOM",
          },
        });
      }
      if (table === "ganha_ganha_store_fees") {
        return makeReadChain({ data: null }); // store sem custom
      }
      if (table === "ganha_ganha_billing_events") {
        return { insert: mockInsert };
      }
      return makeReadChain({ data: null });
    });

    await recordGanhaGanhaBillingEvent({
      brandId: "b1", storeId: "s-no-custom", eventType: "REDEEM",
      pointsAmount: 5, referenceId: "r", referenceType: "REDEMPTION",
    });

    const row = mockInsert.mock.calls[0][0];
    expect(row.fee_per_point).toBe(0.20); // global redeem fee
  });

  it("fee_mode FIXED ignora store_fees mesmo se existir", async () => {
    const storeFeesQuery = vi.fn();
    mockFrom.mockImplementation((table: string) => {
      if (table === "ganha_ganha_config") {
        return makeReadChain({
          data: {
            is_active: true,
            fee_per_point_earned: 0.05,
            fee_per_point_redeemed: 0.10,
            fee_mode: "FIXED",
          },
        });
      }
      if (table === "ganha_ganha_store_fees") {
        storeFeesQuery();
        return makeReadChain({
          data: { fee_per_point_earned: 0.99 },
        });
      }
      if (table === "ganha_ganha_billing_events") {
        return { insert: mockInsert };
      }
      return makeReadChain({ data: null });
    });

    await recordGanhaGanhaBillingEvent({
      brandId: "b1", storeId: "s1", eventType: "EARN",
      pointsAmount: 1, referenceId: "e", referenceType: "EARNING_EVENT",
    });

    // FIXED mode: NÃO consulta store_fees
    expect(storeFeesQuery).not.toHaveBeenCalled();
    expect(mockInsert.mock.calls[0][0].fee_per_point).toBe(0.05);
  });
});
