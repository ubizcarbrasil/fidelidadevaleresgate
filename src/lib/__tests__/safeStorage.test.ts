/**
 * safeStorage — wrappers seguros pra localStorage/sessionStorage.
 * Bug aqui = exception em Safari Private Mode quebra app inteiro,
 * setItem com quota exceeded propaga, sessionStorage tratado igual
 * a localStorage (perde isolamento de tab).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  safeSessionGetItem,
  safeSessionSetItem,
} from "../safeStorage";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("safeGetItem / safeSetItem / safeRemoveItem", () => {
  it("happy path: set + get + remove", () => {
    safeSetItem("k1", "v1");
    expect(safeGetItem("k1")).toBe("v1");
    safeRemoveItem("k1");
    expect(safeGetItem("k1")).toBeNull();
  });

  it("get pra key inexistente: null", () => {
    expect(safeGetItem("nope")).toBeNull();
  });

  it("getItem lança (Safari private): retorna null silencioso", () => {
    const orig = Storage.prototype.getItem;
    Storage.prototype.getItem = () => { throw new Error("SecurityError"); };
    try {
      expect(safeGetItem("any")).toBeNull();
    } finally {
      Storage.prototype.getItem = orig;
    }
  });

  it("setItem lança (quota exceeded): NÃO propaga", () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error("QuotaExceededError"); };
    try {
      expect(() => safeSetItem("k", "v")).not.toThrow();
    } finally {
      Storage.prototype.setItem = orig;
    }
  });

  it("removeItem lança: NÃO propaga", () => {
    const orig = Storage.prototype.removeItem;
    Storage.prototype.removeItem = () => { throw new Error("err"); };
    try {
      expect(() => safeRemoveItem("k")).not.toThrow();
    } finally {
      Storage.prototype.removeItem = orig;
    }
  });
});

describe("safeSessionGetItem / safeSessionSetItem", () => {
  it("usa sessionStorage (não localStorage) — isolamento por tab", () => {
    safeSessionSetItem("s1", "v1");
    expect(safeSessionGetItem("s1")).toBe("v1");
    // localStorage NÃO recebe
    expect(safeGetItem("s1")).toBeNull();
  });

  it("setItem session lança: silent", () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error("denied"); };
    try {
      expect(() => safeSessionSetItem("k", "v")).not.toThrow();
    } finally {
      Storage.prototype.setItem = orig;
    }
  });

  it("getItem session lança: retorna null", () => {
    const orig = Storage.prototype.getItem;
    Storage.prototype.getItem = () => { throw new Error("denied"); };
    try {
      expect(safeSessionGetItem("k")).toBeNull();
    } finally {
      Storage.prototype.getItem = orig;
    }
  });
});
