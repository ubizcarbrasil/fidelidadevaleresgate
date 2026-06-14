/**
 * openLink — abertura central de links com tracking + WEBVIEW vs REDIRECT.
 *
 * Bug aqui:
 *   - Tracking não registrado (analytics quebrada)
 *   - URL externa abrindo no mesmo tab (perde sessão)
 *   - URL interna abre webview (degrada perf — re-monta SPA)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockInsert, mockFrom, mockGetUser } = vi.hoisted(() => {
  const insert = vi.fn().mockResolvedValue({ error: null });
  return {
    mockInsert: insert,
    mockFrom: vi.fn(() => ({ insert })),
    mockGetUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mockFrom,
    auth: { getUser: mockGetUser },
  },
}));

import { openLink, trackClick } from "../openLink";

beforeEach(() => {
  mockInsert.mockClear();
  mockFrom.mockClear();
  mockGetUser.mockClear().mockResolvedValue({ data: { user: { id: "u1" } } });
});

// ── REDIRECT externo ─────────────────────────────────────
describe("openLink — mode REDIRECT", () => {
  it("openInNewTab=true (default): window.open com noopener,noreferrer", async () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    await openLink({ url: "https://external.com", mode: "REDIRECT" });
    expect(openSpy).toHaveBeenCalledWith(
      "https://external.com",
      "_blank",
      "noopener,noreferrer",
    );
    openSpy.mockRestore();
  });

  it("openInNewTab=false: troca window.location.href", async () => {
    // Mock window.location.href via Object.defineProperty pra jsdom
    const realLocation = window.location;
    let writtenHref = "";
    Object.defineProperty(window, "location", {
      value: {
        ...realLocation,
        get href() { return writtenHref; },
        set href(v: string) { writtenHref = v; },
      },
      writable: true,
      configurable: true,
    });
    try {
      await openLink({
        url: "https://x.com",
        mode: "REDIRECT",
        openInNewTab: false,
      });
      expect(writtenHref).toBe("https://x.com");
    } finally {
      Object.defineProperty(window, "location", {
        value: realLocation,
        writable: true,
        configurable: true,
      });
    }
  });
});

// ── WEBVIEW ──────────────────────────────────────────────
describe("openLink — mode WEBVIEW", () => {
  it("URL interna (mesmo origin): navega direto via navigate() pra evitar webview wrapper", async () => {
    const navigate = vi.fn();
    // window.location.origin no jsdom é "http://localhost:3000"
    await openLink({ url: "/customers", mode: "WEBVIEW" }, navigate);
    expect(navigate).toHaveBeenCalledWith("/customers");
  });

  it("URL interna com query+hash: passa intacto pro navigate", async () => {
    const navigate = vi.fn();
    await openLink(
      { url: "/customers?page=2#top", mode: "WEBVIEW" },
      navigate,
    );
    expect(navigate).toHaveBeenCalledWith("/customers?page=2#top");
  });

  it("URL externa: navega pra /webview?url=...", async () => {
    const navigate = vi.fn();
    await openLink(
      {
        url: "https://external.com/page",
        mode: "WEBVIEW",
        title: "Pizza Promo",
      },
      navigate,
    );
    expect(navigate).toHaveBeenCalledOnce();
    const calledWith = navigate.mock.calls[0][0] as string;
    expect(calledWith).toMatch(/^\/webview\?/);
    expect(calledWith).toContain("url=https%3A%2F%2Fexternal.com%2Fpage");
    expect(calledWith).toContain("title=Pizza+Promo");
  });

  it("WEBVIEW externo SEM navigate: location.href direto", async () => {
    const realLocation = window.location;
    let writtenHref = "";
    Object.defineProperty(window, "location", {
      value: {
        ...realLocation,
        get href() { return writtenHref; },
        set href(v: string) { writtenHref = v; },
        origin: realLocation.origin,
      },
      writable: true,
      configurable: true,
    });
    try {
      await openLink({ url: "https://x.com", mode: "WEBVIEW" });
      expect(writtenHref).toMatch(/^\/webview\?/);
    } finally {
      Object.defineProperty(window, "location", {
        value: realLocation,
        writable: true,
        configurable: true,
      });
    }
  });

  it("WEBVIEW respeita opções: showHeader=false, shareEnabled=true, allowBack=false", async () => {
    const navigate = vi.fn();
    await openLink(
      {
        url: "https://x.com",
        mode: "WEBVIEW",
        showHeader: false,
        shareEnabled: true,
        allowBack: false,
      },
      navigate,
    );
    const path = navigate.mock.calls[0][0] as string;
    expect(path).not.toContain("header=1");
    expect(path).toContain("share=1");
    expect(path).not.toContain("back=1");
  });

  it("title default 'Ofertas' não aparece no params (passa empty)", async () => {
    const navigate = vi.fn();
    await openLink({ url: "https://x.com", mode: "WEBVIEW" }, navigate);
    const path = navigate.mock.calls[0][0] as string;
    // title é opcional: sem opts.title, o param não vem (não tem default
    // "Ofertas" no openLink — buildWebviewWrapperUrl tem)
    expect(path).not.toContain("title=");
  });
});

// ── Tracking ─────────────────────────────────────────────
describe("openLink + trackClick — tracking", () => {
  const tracking = {
    brand_id: "b1",
    branch_id: "br1",
    customer_id: "c1",
    click_type: "OFFER_LIST",
  };

  it("openLink com tracking: insere em link_clicks via Supabase", async () => {
    vi.spyOn(window, "open").mockReturnValue(null);
    await openLink({
      url: "https://x.com",
      mode: "REDIRECT",
      tracking,
    });
    expect(mockFrom).toHaveBeenCalledWith("link_clicks");
    expect(mockInsert).toHaveBeenCalledOnce();
    const row = mockInsert.mock.calls[0][0];
    expect(row).toMatchObject({
      brand_id: "b1",
      branch_id: "br1",
      customer_id: "c1",
      click_type: "OFFER_LIST",
      url: "https://x.com",
      mode: "REDIRECT",
    });
  });

  it("openLink sem tracking: NÃO chama Supabase", async () => {
    vi.spyOn(window, "open").mockReturnValue(null);
    await openLink({ url: "https://x.com", mode: "REDIRECT" });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("tracking com user_id null (auth ausente): preserva null no payload", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    vi.spyOn(window, "open").mockReturnValue(null);
    await openLink({ url: "https://x.com", mode: "REDIRECT", tracking });
    expect(mockInsert.mock.calls[0][0].user_id).toBeNull();
  });

  it("tracking insert falha: NÃO bloqueia abertura do link", async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: "RLS denied" } });
    mockGetUser.mockRejectedValueOnce(new Error("network"));
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    await openLink({ url: "https://x.com", mode: "REDIRECT", tracking });
    expect(openSpy).toHaveBeenCalled(); // link abriu mesmo com tracking falhando
    openSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("trackClick sem tracking: no-op", async () => {
    await trackClick(undefined);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("trackClick com tracking: insere com mode='INTERNAL'", async () => {
    await trackClick({ ...tracking, url: "/internal/path" });
    expect(mockFrom).toHaveBeenCalledWith("link_clicks");
    const row = mockInsert.mock.calls[0][0];
    expect(row.mode).toBe("INTERNAL");
    expect(row.url).toBe("/internal/path");
  });
});
