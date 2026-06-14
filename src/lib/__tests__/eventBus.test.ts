/**
 * eventBus — pub/sub leve com handlers em microtask.
 *
 * Bug aqui = invalidações de query não disparam (cache stale após
 * mutation) OU handler que falha derruba outros handlers.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { eventBus } from "../eventBus";

beforeEach(() => {
  eventBus.clear();
});

describe("eventBus.on / emit", () => {
  it("emit dispara handler registrado (microtask)", async () => {
    const cb = vi.fn();
    eventBus.on("CUSTOMER_CREATED", cb);
    eventBus.emit("CUSTOMER_CREATED", {
      brandId: "b1",
      customerId: "c1",
    });
    // queueMicrotask → precisa de await pra processar
    await Promise.resolve();
    expect(cb).toHaveBeenCalledWith({ brandId: "b1", customerId: "c1" });
  });

  it("emit não bloqueia caller (handler roda em microtask)", () => {
    const cb = vi.fn();
    eventBus.on("CUSTOMER_CREATED", cb);
    eventBus.emit("CUSTOMER_CREATED", { brandId: "b1", customerId: "c1" });
    // Síncrono após emit: handler ainda NÃO rodou
    expect(cb).not.toHaveBeenCalled();
  });

  it("múltiplos handlers do mesmo evento: todos disparam", async () => {
    const a = vi.fn();
    const b = vi.fn();
    eventBus.on("VOUCHER_CREATED", a);
    eventBus.on("VOUCHER_CREATED", b);
    eventBus.emit("VOUCHER_CREATED", { brandId: "b1", code: "X" });
    await Promise.resolve();
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });

  it("handler isolado: não recebe eventos de outro tipo", async () => {
    const a = vi.fn();
    eventBus.on("VOUCHER_CREATED", a);
    eventBus.emit("CUSTOMER_CREATED", { brandId: "b1", customerId: "c1" });
    await Promise.resolve();
    expect(a).not.toHaveBeenCalled();
  });

  it("emit sem handlers: no-op (não throw)", () => {
    expect(() =>
      eventBus.emit("STORE_APPROVED", { brandId: "b1", storeId: "s1" }),
    ).not.toThrow();
  });
});

describe("eventBus.on — unsubscribe", () => {
  it("unsub retornado para de receber eventos", async () => {
    const cb = vi.fn();
    const unsub = eventBus.on("CUSTOMER_CREATED", cb);
    eventBus.emit("CUSTOMER_CREATED", { brandId: "b1", customerId: "c1" });
    await Promise.resolve();
    expect(cb).toHaveBeenCalledOnce();

    unsub();
    eventBus.emit("CUSTOMER_CREATED", { brandId: "b1", customerId: "c2" });
    await Promise.resolve();
    expect(cb).toHaveBeenCalledOnce(); // não chamou de novo
  });

  it("unsub idempotente (não throw em segunda chamada)", () => {
    const cb = vi.fn();
    const unsub = eventBus.on("CUSTOMER_CREATED", cb);
    unsub();
    expect(() => unsub()).not.toThrow();
  });

  it("handler duplicado (mesma ref): registrado 1x via Set", async () => {
    const cb = vi.fn();
    eventBus.on("CUSTOMER_CREATED", cb);
    eventBus.on("CUSTOMER_CREATED", cb); // segundo registro mesmo handler
    eventBus.emit("CUSTOMER_CREATED", { brandId: "b1", customerId: "c1" });
    await Promise.resolve();
    expect(cb).toHaveBeenCalledOnce();
  });
});

describe("eventBus — isolamento de erros", () => {
  it("handler que lança NÃO derruba outros handlers", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const broken = vi.fn(() => { throw new Error("boom"); });
    const ok = vi.fn();
    eventBus.on("CUSTOMER_CREATED", broken);
    eventBus.on("CUSTOMER_CREATED", ok);
    eventBus.emit("CUSTOMER_CREATED", { brandId: "b1", customerId: "c1" });
    await Promise.resolve();
    expect(broken).toHaveBeenCalledOnce();
    expect(ok).toHaveBeenCalledOnce(); // não foi derrubado
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});

describe("eventBus.clear", () => {
  it("clear remove TODOS os listeners", async () => {
    const a = vi.fn();
    const b = vi.fn();
    eventBus.on("CUSTOMER_CREATED", a);
    eventBus.on("VOUCHER_CREATED", b);
    eventBus.clear();
    eventBus.emit("CUSTOMER_CREATED", { brandId: "b1", customerId: "c1" });
    eventBus.emit("VOUCHER_CREATED", { brandId: "b1", code: "X" });
    await Promise.resolve();
    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });
});
