/**
 * eventBusQueryBridge — escuta eventos do eventBus e invalida queries
 * automaticamente. Bug aqui = mutations não refletem em listas (cache
 * stale) ou invalidação cega que limpa demais.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { eventBus } from "../eventBus";
import { queryKeys } from "../queryKeys";
import { initEventBusQueryBridge } from "../eventBusQueryBridge";

// Cleanup entre testes: cada init retorna uma função; chamamos pra
// resetar o singleton `initialized` SEM vi.resetModules (que iria
// fragmentar a referência ao eventBus singleton).
let cleanups: Array<() => void> = [];

beforeEach(() => {
  cleanups = [];
  eventBus.clear();
});

afterEach(() => {
  cleanups.forEach((fn) => fn());
});

function setupBridge() {
  const qc = { invalidateQueries: vi.fn() };
  cleanups.push(initEventBusQueryBridge(qc as never));
  return qc;
}

describe("initEventBusQueryBridge — idempotency", () => {
  it("primeira chamada retorna função de cleanup", () => {
    const qc = { invalidateQueries: vi.fn() };
    const cleanup = initEventBusQueryBridge(qc as never);
    cleanups.push(cleanup);
    expect(typeof cleanup).toBe("function");
  });

  it("segunda chamada NO-OP (não duplica invalidações pro mesmo evento)", async () => {
    const qc = setupBridge();
    // Segunda init dentro do mesmo "ciclo" — deveria ser ignorada
    const cleanup2 = initEventBusQueryBridge(qc as never);
    cleanups.push(cleanup2);

    eventBus.emit("CUSTOMER_CREATED", { brandId: "b1", customerId: "c1" });
    await Promise.resolve();
    // Não duplicou: customers.all + dashboard.all = 2 chamadas exatas
    expect(qc.invalidateQueries).toHaveBeenCalledTimes(2);
  });
});

describe("Bridge — invalidação por evento", () => {
  it("CUSTOMER_CREATED → invalida customers.all + dashboard.all", async () => {
    const qc = setupBridge();
    eventBus.emit("CUSTOMER_CREATED", { brandId: "b1", customerId: "c1" });
    await Promise.resolve();

    expect(qc.invalidateQueries).toHaveBeenCalledTimes(2);
    expect(qc.invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.customers.all });
    expect(qc.invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.dashboard.all });
  });

  it("VOUCHER_CREATED → invalida só vouchers.all", async () => {
    const qc = setupBridge();
    eventBus.emit("VOUCHER_CREATED", { brandId: "b1", code: "X" });
    await Promise.resolve();

    expect(qc.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(qc.invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.vouchers.all });
  });

  it("EARNING_CREATED → invalida 4 chaves (earnings/ledger/customers/dashboard)", async () => {
    const qc = setupBridge();
    eventBus.emit("EARNING_CREATED", {
      brandId: "b1", customerId: "c1", points: 10, eventId: "e1",
    });
    await Promise.resolve();

    expect(qc.invalidateQueries).toHaveBeenCalledTimes(4);
  });

  it("Eventos com [] (RANKING_TOP10_ENTRY): registrados mas nada invalidam", async () => {
    const qc = setupBridge();
    eventBus.emit("RANKING_TOP10_ENTRY", {
      brandId: "b1", customerId: "c1", position: 5,
    });
    await Promise.resolve();
    expect(qc.invalidateQueries).not.toHaveBeenCalled();
  });

  it("Sem emissão: 0 invalidações", () => {
    const qc = setupBridge();
    expect(qc.invalidateQueries).not.toHaveBeenCalled();
  });
});

describe("Bridge cleanup", () => {
  it("cleanup para de invalidar", async () => {
    const qc = { invalidateQueries: vi.fn() };
    const cleanup = initEventBusQueryBridge(qc as never);

    eventBus.emit("CUSTOMER_CREATED", { brandId: "b1", customerId: "c1" });
    await Promise.resolve();
    expect(qc.invalidateQueries).toHaveBeenCalledTimes(2);

    cleanup();

    eventBus.emit("CUSTOMER_CREATED", { brandId: "b1", customerId: "c2" });
    await Promise.resolve();
    expect(qc.invalidateQueries).toHaveBeenCalledTimes(2);
  });

  it("cleanup permite re-init com novo queryClient", async () => {
    const qc1 = { invalidateQueries: vi.fn() };
    const c1 = initEventBusQueryBridge(qc1 as never);
    c1();

    const qc2 = { invalidateQueries: vi.fn() };
    const c2 = initEventBusQueryBridge(qc2 as never);
    cleanups.push(c2);

    eventBus.emit("VOUCHER_CREATED", { brandId: "b1", code: "X" });
    await Promise.resolve();
    expect(qc2.invalidateQueries).toHaveBeenCalledOnce();
    expect(qc1.invalidateQueries).not.toHaveBeenCalled();
  });
});
