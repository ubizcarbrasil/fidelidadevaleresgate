/**
 * useLinkPublicoOfertas — resolve URL pública /ofertas pra brand.
 * Prioridade: origin atual (se prod) > backend resolve > fallback.
 *
 * Bug aqui = link gerado aponta pra preview Lovable (vaza URL interna),
 * URL com http aceita (deveria forçar https), barras duplicadas
 * (http:///ofertas) viram 404.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const { mockGetPublicOrigin } = vi.hoisted(() => ({
  mockGetPublicOrigin: vi.fn(),
}));

vi.mock("@/lib/publicShareUrl", () => ({
  getPublicOrigin: mockGetPublicOrigin,
}));

import { useLinkPublicoOfertas } from "../hook_link_publico_ofertas";

function setLocation(hostname: string, origin: string) {
  Object.defineProperty(window, "location", {
    writable: true,
    configurable: true,
    value: { hostname, origin, pathname: "/", search: "" },
  });
}

beforeEach(() => {
  mockGetPublicOrigin.mockReset();
});

describe("useLinkPublicoOfertas — origin atual (prioridade 1)", () => {
  it("hostname production (não preview): usa origin atual + /ofertas", async () => {
    setLocation("pizza.valeresgate.com.br", "https://pizza.valeresgate.com.br");
    const { result } = renderHook(() => useLinkPublicoOfertas("b1"));
    await waitFor(() => expect(result.current.url).toBe("https://pizza.valeresgate.com.br/ofertas"));
    expect(mockGetPublicOrigin).not.toHaveBeenCalled();
  });

  it("hostname com preview--: IGNORA origin atual (preview Lovable)", async () => {
    setLocation("preview--xyz.lovableproject.com", "https://preview--xyz.lovableproject.com");
    mockGetPublicOrigin.mockResolvedValue("https://app.valeresgate.com.br");
    const { result } = renderHook(() => useLinkPublicoOfertas("b1"));
    await waitFor(() => expect(result.current.url).toBe("https://app.valeresgate.com.br/ofertas"));
    expect(mockGetPublicOrigin).toHaveBeenCalledWith("b1");
  });

  it("hostname .lovableproject.com: IGNORA origin atual", async () => {
    setLocation("xyz.lovableproject.com", "https://xyz.lovableproject.com");
    mockGetPublicOrigin.mockResolvedValue("https://app.valeresgate.com.br");
    const { result } = renderHook(() => useLinkPublicoOfertas("b1"));
    await waitFor(() => expect(result.current.url).toBe("https://app.valeresgate.com.br/ofertas"));
  });

  it("hostname localhost: IGNORA (não serve pra link público)", async () => {
    setLocation("localhost", "http://localhost:8080");
    mockGetPublicOrigin.mockResolvedValue("https://app.valeresgate.com.br");
    const { result } = renderHook(() => useLinkPublicoOfertas("b1"));
    await waitFor(() => expect(result.current.url).toBe("https://app.valeresgate.com.br/ofertas"));
  });

  it("hostname 127.0.0.1: IGNORA", async () => {
    setLocation("127.0.0.1", "http://127.0.0.1:8080");
    mockGetPublicOrigin.mockResolvedValue("https://app.valeresgate.com.br");
    const { result } = renderHook(() => useLinkPublicoOfertas("b1"));
    await waitFor(() => expect(result.current.url).toBe("https://app.valeresgate.com.br/ofertas"));
  });
});

describe("useLinkPublicoOfertas — backend (prioridade 2)", () => {
  beforeEach(() => {
    setLocation("localhost", "http://localhost:8080");
  });

  it("origin válido do backend: usa", async () => {
    mockGetPublicOrigin.mockResolvedValue("https://customdomain.com");
    const { result } = renderHook(() => useLinkPublicoOfertas("b1"));
    await waitFor(() => expect(result.current.url).toBe("https://customdomain.com/ofertas"));
  });

  it("origin com http://: força https://", async () => {
    mockGetPublicOrigin.mockResolvedValue("http://insecure.com");
    const { result } = renderHook(() => useLinkPublicoOfertas("b1"));
    await waitFor(() => expect(result.current.url).toBe("https://insecure.com/ofertas"));
  });

  it("origin invalid (sem ponto): usa fallback published", async () => {
    mockGetPublicOrigin.mockResolvedValue("notavalidurl");
    const { result } = renderHook(() => useLinkPublicoOfertas("b1"));
    await waitFor(() => expect(result.current.url).toContain("fidelidadevaleresgate.lovable.app"));
  });

  it("backend throw: cai no fallback", async () => {
    mockGetPublicOrigin.mockRejectedValue(new Error("RPC failed"));
    const { result } = renderHook(() => useLinkPublicoOfertas("b1"));
    await waitFor(() => expect(result.current.url).toContain("fidelidadevaleresgate.lovable.app"));
  });

  it("origin null: usa fallback", async () => {
    mockGetPublicOrigin.mockResolvedValue(null);
    const { result } = renderHook(() => useLinkPublicoOfertas("b1"));
    await waitFor(() => expect(result.current.url).toContain("fidelidadevaleresgate.lovable.app"));
  });

  it("carregando flag: true durante fetch, false após resolução", async () => {
    let resolveOrigin!: (v: string) => void;
    mockGetPublicOrigin.mockImplementation(
      () => new Promise<string>((r) => { resolveOrigin = r; }),
    );
    const { result } = renderHook(() => useLinkPublicoOfertas("b1"));
    await waitFor(() => expect(result.current.carregando).toBe(true));
    resolveOrigin("https://x.com");
    await waitFor(() => expect(result.current.carregando).toBe(false));
  });
});

describe("useLinkPublicoOfertas — guards", () => {
  it("brandId undefined: url=''", async () => {
    setLocation("pizza.com", "https://pizza.com");
    const { result } = renderHook(() => useLinkPublicoOfertas(undefined));
    await waitFor(() => expect(result.current.url).toBe(""));
    expect(mockGetPublicOrigin).not.toHaveBeenCalled();
  });
});
