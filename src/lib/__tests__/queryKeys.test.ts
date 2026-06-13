import { describe, it, expect } from "vitest";
import { queryKeys } from "../queryKeys";

/**
 * QueryKeys é a fonte da verdade do invalidation. Bugs aqui = caches
 * que nunca refrescam OU invalidação que limpa demais.
 *
 * Cobre:
 *   1. Factory createKeys produz prefixes consistentes
 *   2. Match-by-prefix (semântica usada por queryClient.invalidateQueries)
 *   3. Independência entre módulos (invalidar A não toca B)
 *   4. Discriminação por args na lista
 */

function isPrefix<T>(prefix: readonly T[], full: readonly T[]): boolean {
  return prefix.every((v, i) => full[i] === v);
}

describe("queryKeys factory createKeys", () => {
  it("'all' é o prefix único do módulo", () => {
    expect(queryKeys.customers.all).toEqual(["customers"]);
  });

  it("'lists' é prefix de 'list(args)'", () => {
    const lists = queryKeys.customers.lists();
    const list = queryKeys.customers.list("brand-1", 2);
    expect(isPrefix(lists, list)).toBe(true);
  });

  it("'details' é prefix de 'detail(id)'", () => {
    const details = queryKeys.customers.details();
    const detail = queryKeys.customers.detail("cust-123");
    expect(isPrefix(details, detail)).toBe(true);
  });

  it("'all' é prefix de tudo no módulo", () => {
    const all = queryKeys.customers.all;
    expect(isPrefix(all, queryKeys.customers.list("x"))).toBe(true);
    expect(isPrefix(all, queryKeys.customers.detail("y"))).toBe(true);
    expect(isPrefix(all, queryKeys.customers.lists())).toBe(true);
    expect(isPrefix(all, queryKeys.customers.details())).toBe(true);
    expect(isPrefix(all, queryKeys.customers.stats("z"))).toBe(true);
  });
});

describe("queryKeys discrimination", () => {
  it("list args distinguem queries diferentes", () => {
    const a = queryKeys.customers.list("brand-1", 1);
    const b = queryKeys.customers.list("brand-1", 2);
    expect(a).not.toEqual(b);
  });

  it("detail por id distingue entidades", () => {
    expect(queryKeys.customers.detail("a")).not.toEqual(
      queryKeys.customers.detail("b"),
    );
  });

  it("módulos diferentes têm prefixes incompatíveis", () => {
    const customersAll = queryKeys.customers.all;
    const offersAll = queryKeys.offers.all;
    expect(isPrefix(customersAll, offersAll)).toBe(false);
    expect(isPrefix(offersAll, customersAll)).toBe(false);
  });
});

describe("queryKeys composite modules (crm, customer-wallet)", () => {
  it("crm.contacts é namespace separado de crm.events", () => {
    const contactsAll = queryKeys.crm.contacts.all;
    const eventsAll = queryKeys.crm.events.all;
    expect(isPrefix(contactsAll, eventsAll)).toBe(false);
  });

  it("customerWallet.ledger usa key dedicado, não 'list'", () => {
    const ledger = queryKeys.customerWallet.ledger("cust-1");
    expect(ledger[0]).toBe("customer-wallet-ledger");
  });

  it("customerWallet.count é separado de ledger", () => {
    const ledger = queryKeys.customerWallet.ledger();
    const count = queryKeys.customerWallet.count();
    expect(ledger[0]).not.toBe(count[0]);
  });
});

describe("queryKeys.demoStores / demoDeals composite", () => {
  it("demoStores.list discrimina por brandId", () => {
    const a = queryKeys.demoStores.list("brand-A");
    const b = queryKeys.demoStores.list("brand-B");
    expect(a).not.toEqual(b);
  });

  it("demoStores.all cobre todas as listas/details", () => {
    const all = queryKeys.demoStores.all;
    const list = queryKeys.demoStores.list("brand-A");
    expect(isPrefix(all, list)).toBe(true);
  });
});
