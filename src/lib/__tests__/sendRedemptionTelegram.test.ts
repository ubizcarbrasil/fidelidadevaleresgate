/**
 * sendRedemptionTelegram — disparo opcional de notificação Telegram
 * após resgate. Bug aqui = falha de Telegram bloqueia checkout
 * (UX morta) ou notif disparada pra brand sem config (waste).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFrom, mockInvoke } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockInvoke: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom, functions: { invoke: mockInvoke } },
}));

import { sendRedemptionTelegramNotification } from "../sendRedemptionTelegram";

function chain(result: { data?: unknown; error?: unknown }) {
  const c: Record<string, unknown> = {};
  ["select", "eq", "not", "limit"].forEach((op) => { c[op] = vi.fn(() => c); });
  c.then = (resolve: (r: unknown) => void) => resolve(result);
  return c;
}

const PAYLOAD = {
  brandId: "b1",
  branchId: "br1",
  customerName: "Maria",
  customerPhone: "11999999999",
  productTitle: "Pizza",
  pointsSpent: 100,
  deliveryAddress: "Rua X, 1",
  orderSource: "customer" as const,
};

beforeEach(() => {
  mockFrom.mockReset();
  mockInvoke.mockReset();
});

describe("sendRedemptionTelegramNotification", () => {
  it("sem telegram_chat_id na brand: NÃO chama edge function", async () => {
    mockFrom.mockReturnValue(chain({ data: [], error: null }));
    await sendRedemptionTelegramNotification(PAYLOAD);
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it("com chat_id: invoca send-telegram-ride-notification com payload formatado", async () => {
    mockFrom.mockReturnValue(chain({
      data: [{ telegram_chat_id: "chat-123" }],
      error: null,
    }));
    mockInvoke.mockResolvedValue({ data: null, error: null });

    await sendRedemptionTelegramNotification({
      ...PAYLOAD,
      customerCpf: "12345678910",
      productUrl: "https://x.com/p",
    });

    expect(mockInvoke).toHaveBeenCalledWith(
      "send-telegram-ride-notification",
      expect.objectContaining({
        body: expect.objectContaining({
          chat_id: "chat-123",
          is_redemption_notification: true,
          customer_name: "Maria",
          customer_cpf: "12345678910",
          product_title: "Pizza",
          points_spent: 100,
          product_url: "https://x.com/p",
          order_source: "customer",
        }),
      }),
    );
  });

  it("supabase query lança: NÃO propaga (não bloqueia checkout)", async () => {
    mockFrom.mockImplementation(() => { throw new Error("network down"); });
    await expect(sendRedemptionTelegramNotification(PAYLOAD)).resolves.toBeUndefined();
  });

  it("invoke lança: NÃO propaga", async () => {
    mockFrom.mockReturnValue(chain({
      data: [{ telegram_chat_id: "chat-1" }],
      error: null,
    }));
    mockInvoke.mockRejectedValue(new Error("function timeout"));
    await expect(sendRedemptionTelegramNotification(PAYLOAD)).resolves.toBeUndefined();
  });

  it("orderSource='driver' passa pro body", async () => {
    mockFrom.mockReturnValue(chain({
      data: [{ telegram_chat_id: "chat-1" }],
      error: null,
    }));
    mockInvoke.mockResolvedValue({ data: null });
    await sendRedemptionTelegramNotification({
      ...PAYLOAD,
      orderSource: "driver",
    });
    expect(mockInvoke.mock.calls[0][1].body.order_source).toBe("driver");
  });
});
