/**
 * Batch 6: useCustomerNotifications + useAdminNotifications.
 *
 * Bug aqui = notificações nunca aparecem ou unreadCount fica errado,
 * markAsRead não persiste, realtime não conecta.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const { mockFrom, mockChannel, mockRemoveChannel } = vi.hoisted(() => {
  const channelObj = {
    on: vi.fn(() => channelObj),
    subscribe: vi.fn(() => channelObj),
  };
  return {
    mockFrom: vi.fn(),
    mockChannel: vi.fn(() => channelObj),
    mockRemoveChannel: vi.fn(),
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mockFrom,
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  },
}));

const mockCustomer: { customer: { id: string } | null } = { customer: null };
vi.mock("@/contexts/CustomerContext", () => ({
  useCustomer: () => mockCustomer,
}));

const mockGuard: { currentBrandId: string | null } = { currentBrandId: null };
vi.mock("@/hooks/useBrandGuard", () => ({
  useBrandGuard: () => mockGuard,
}));

import { useCustomerNotifications } from "../useCustomerNotifications";
import { useAdminNotifications } from "../useAdminNotifications";

function listChain(result: { data?: unknown }) {
  const c: Record<string, unknown> = {};
  c.select = vi.fn(() => c);
  c.eq = vi.fn(() => c);
  c.order = vi.fn(() => c);
  c.limit = vi.fn(() => Promise.resolve(result));
  c.then = (resolve: (r: unknown) => void) => resolve(result);
  return c;
}

function updateChain(result: { error?: unknown }) {
  const c: Record<string, unknown> = {};
  c.update = vi.fn(() => c);
  c.eq = vi.fn(() => c);
  c.then = (resolve: (r: unknown) => void) => resolve(result);
  return c;
}

beforeEach(() => {
  mockFrom.mockReset();
  mockChannel.mockClear();
  mockRemoveChannel.mockReset();
  mockCustomer.customer = null;
  mockGuard.currentBrandId = null;
});

// ── useCustomerNotifications ────────────────────────────
describe("useCustomerNotifications", () => {
  it("sem customer: notifications=[], unreadCount=0", async () => {
    const { result } = renderHook(() => useCustomerNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it("customer + 3 notifs (2 unread): unreadCount=2", async () => {
    mockCustomer.customer = { id: "c1" };
    mockFrom.mockReturnValue(listChain({
      data: [
        { id: "n1", is_read: false, title: "A", body: null, type: "x", reference_id: null, reference_type: null, created_at: "x" },
        { id: "n2", is_read: true, title: "B", body: null, type: "x", reference_id: null, reference_type: null, created_at: "x" },
        { id: "n3", is_read: false, title: "C", body: null, type: "x", reference_id: null, reference_type: null, created_at: "x" },
      ],
    }));
    const { result } = renderHook(() => useCustomerNotifications());
    await waitFor(() => expect(result.current.notifications).toHaveLength(3));
    expect(result.current.unreadCount).toBe(2);
  });

  it("Realtime channel criado com customer.id no name", async () => {
    mockCustomer.customer = { id: "c1" };
    mockFrom.mockReturnValue(listChain({ data: [] }));
    renderHook(() => useCustomerNotifications());
    await waitFor(() => expect(mockChannel).toHaveBeenCalled());
    expect(mockChannel.mock.calls[0][0]).toContain("c1");
  });

  it("markAsRead atualiza local state + UPDATE no DB", async () => {
    mockCustomer.customer = { id: "c1" };
    mockFrom.mockReturnValue(listChain({
      data: [
        { id: "n1", is_read: false, title: "A", body: null, type: "x", reference_id: null, reference_type: null, created_at: "x" },
      ],
    }));
    const { result } = renderHook(() => useCustomerNotifications());
    await waitFor(() => expect(result.current.unreadCount).toBe(1));

    mockFrom.mockReturnValue(updateChain({ error: null }));

    await act(async () => {
      await result.current.markAsRead("n1");
    });

    expect(result.current.notifications.find((n) => n.id === "n1")?.is_read).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it("markAllAsRead zera unreadCount", async () => {
    mockCustomer.customer = { id: "c1" };
    mockFrom.mockReturnValue(listChain({
      data: [
        { id: "n1", is_read: false, title: "A", body: null, type: "x", reference_id: null, reference_type: null, created_at: "x" },
        { id: "n2", is_read: false, title: "B", body: null, type: "x", reference_id: null, reference_type: null, created_at: "x" },
      ],
    }));
    const { result } = renderHook(() => useCustomerNotifications());
    await waitFor(() => expect(result.current.unreadCount).toBe(2));

    mockFrom.mockReturnValue(updateChain({ error: null }));

    await act(async () => {
      await result.current.markAllAsRead();
    });

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications.every((n) => n.is_read)).toBe(true);
  });
});

// ── useAdminNotifications ───────────────────────────────
describe("useAdminNotifications", () => {
  it("enabled=false: notifications=[]", async () => {
    mockGuard.currentBrandId = "b1";
    const { result } = renderHook(() => useAdminNotifications(false));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notifications).toEqual([]);
  });

  it("currentBrandId null: vazio", async () => {
    const { result } = renderHook(() => useAdminNotifications(true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notifications).toEqual([]);
  });

  it("brand + enabled: fetcha notifs e popula unreadCount", async () => {
    mockGuard.currentBrandId = "b1";
    mockFrom.mockReturnValue(listChain({
      data: [
        { id: "n1", brand_id: "b1", title: "X", body: null, type: "alert", reference_id: null, is_read: false, created_at: "x" },
      ],
    }));
    const { result } = renderHook(() => useAdminNotifications(true));
    await waitFor(() => expect(result.current.notifications).toHaveLength(1));
    expect(result.current.unreadCount).toBe(1);
  });

  it("Realtime channel name inclui brand_id", async () => {
    mockGuard.currentBrandId = "b1";
    mockFrom.mockReturnValue(listChain({ data: [] }));
    renderHook(() => useAdminNotifications(true));
    await waitFor(() => expect(mockChannel).toHaveBeenCalled());
    expect(mockChannel.mock.calls[0][0]).toContain("b1");
  });
});
