/**
 * queryClient — config global do TanStack React Query.
 * Bug aqui = staleTime baixo demais (refetch agressivo, latência), retry
 * infinito em erro permanente, refetchOnWindowFocus traz dados velhos
 * silenciosamente.
 */
import { describe, it, expect } from "vitest";
import { queryClient } from "../queryClient";
import { CACHE } from "@/config/constants";

describe("queryClient — defaults de queries", () => {
  it("staleTime: STALE_TIME_MEDIUM (5min)", () => {
    const opts = queryClient.getDefaultOptions().queries;
    expect(opts?.staleTime).toBe(CACHE.STALE_TIME_MEDIUM);
    expect(opts?.staleTime).toBe(5 * 60 * 1000);
  });

  it("gcTime: CACHE.GC_TIME", () => {
    const opts = queryClient.getDefaultOptions().queries;
    expect(opts?.gcTime).toBe(CACHE.GC_TIME);
  });

  it("retry = 1 (não infinito)", () => {
    const opts = queryClient.getDefaultOptions().queries;
    expect(opts?.retry).toBe(1);
  });

  it("refetchOnWindowFocus = false (evita refetch em volta de aba)", () => {
    const opts = queryClient.getDefaultOptions().queries;
    expect(opts?.refetchOnWindowFocus).toBe(false);
  });

  it("refetchOnReconnect = false", () => {
    const opts = queryClient.getDefaultOptions().queries;
    expect(opts?.refetchOnReconnect).toBe(false);
  });
});

describe("queryClient — defaults de mutations", () => {
  it("retry = 1", () => {
    const opts = queryClient.getDefaultOptions().mutations;
    expect(opts?.retry).toBe(1);
  });

  it("retryDelay: backoff exponencial com cap 10s", () => {
    const opts = queryClient.getDefaultOptions().mutations;
    const delayFn = opts?.retryDelay as (n: number) => number;
    // 1000 * 2^0 = 1000
    expect(delayFn(0)).toBe(1000);
    // 1000 * 2^1 = 2000
    expect(delayFn(1)).toBe(2000);
    // 1000 * 2^3 = 8000
    expect(delayFn(3)).toBe(8000);
    // 1000 * 2^10 = capped at 10000
    expect(delayFn(10)).toBe(10_000);
  });
});

describe("queryClient — funcionalidade básica", () => {
  it("setQueryData + getQueryData: round-trip", () => {
    queryClient.setQueryData(["test-key"], { value: 42 });
    expect(queryClient.getQueryData(["test-key"])).toEqual({ value: 42 });
    queryClient.removeQueries({ queryKey: ["test-key"] });
  });
});
