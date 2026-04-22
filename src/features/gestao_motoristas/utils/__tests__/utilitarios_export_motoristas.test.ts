import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock do supabase client antes de importar o módulo sob teste.
vi.mock("@/integrations/supabase/client", () => {
  const upload = vi.fn();
  const createSignedUrl = vi.fn();
  const getUser = vi.fn();
  return {
    supabase: {
      auth: { getUser },
      storage: { from: vi.fn(() => ({ upload, createSignedUrl })) },
    },
    __mocks: { upload, createSignedUrl, getUser },
  };
});

import {
  ehIOS,
  ehStandalonePWA,
  exigeUrlHttps,
  abrirCsvPorUrl,
  uploadCsvParaStorage,
  gerarCsvMotoristas,
} from "../utilitarios_export_motoristas";
import { supabase } from "@/integrations/supabase/client";

const UA_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const UA_DESKTOP =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

function setUserAgent(ua: string) {
  Object.defineProperty(window.navigator, "userAgent", {
    value: ua,
    configurable: true,
  });
}

function setStandalone(value: boolean) {
  (window.navigator as any).standalone = value;
  window.matchMedia = ((q: string) => ({
    matches: value && q.includes("standalone"),
    media: q,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as any;
}

describe("utilitarios_export_motoristas - detecção de plataforma", () => {
  beforeEach(() => {
    setUserAgent(UA_DESKTOP);
    setStandalone(false);
  });

  it("ehIOS retorna true em iPhone", () => {
    setUserAgent(UA_IPHONE);
    expect(ehIOS()).toBe(true);
  });

  it("ehIOS retorna false em desktop", () => {
    expect(ehIOS()).toBe(false);
  });

  it("ehStandalonePWA retorna true quando navigator.standalone = true", () => {
    setStandalone(true);
    expect(ehStandalonePWA()).toBe(true);
  });

  it("exigeUrlHttps é true em iPhone (mesmo sem standalone)", () => {
    setUserAgent(UA_IPHONE);
    setStandalone(false);
    expect(exigeUrlHttps()).toBe(true);
  });

  it("exigeUrlHttps é true em PWA standalone", () => {
    setStandalone(true);
    expect(exigeUrlHttps()).toBe(true);
  });

  it("exigeUrlHttps é false em desktop normal", () => {
    expect(exigeUrlHttps()).toBe(false);
  });
});

describe("abrirCsvPorUrl", () => {
  beforeEach(() => {
    setUserAgent(UA_DESKTOP);
    setStandalone(false);
  });

  it("REGRESSÃO iOS PWA: usa window.location.assign(URL HTTPS) e NUNCA window.open(blob:)", async () => {
    setUserAgent(UA_IPHONE);
    setStandalone(true);

    const assignSpy = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, assign: assignSpy },
    });
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    const url = "https://meudominio.supabase.co/storage/v1/object/sign/exportacoes-motoristas/abc.csv?token=xxx";
    const modo = await abrirCsvPorUrl(url, "motoristas.csv");

    expect(modo).toBe("url-https");
    expect(assignSpy).toHaveBeenCalledWith(url);
    expect(assignSpy).toHaveBeenCalledTimes(1);
    // CRÍTICO: garante que o caminho que causava tela branca não é mais usado.
    expect(openSpy).not.toHaveBeenCalled();
    // Garante que NUNCA recebemos uma blob: URL nesse caminho.
    expect(assignSpy.mock.calls[0][0]).not.toMatch(/^blob:/);

    openSpy.mockRestore();
  });

  it("Desktop: cria <a download> e dispara click", async () => {
    const clickSpy = vi.fn();
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === "a") (el as HTMLAnchorElement).click = clickSpy;
      return el;
    });

    const url = "https://example.com/arquivo.csv";
    const modo = await abrirCsvPorUrl(url, "motoristas.csv");

    expect(modo).toBe("download-direto");
    expect(clickSpy).toHaveBeenCalledTimes(1);

    vi.restoreAllMocks();
  });
});

describe("uploadCsvParaStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envia o arquivo no caminho do usuário e retorna URL assinada", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    const upload = vi.fn().mockResolvedValue({ error: null });
    const createSignedUrl = vi.fn().mockResolvedValue({
      data: { signedUrl: "https://storage.lovable.co/sign/abc?token=t" },
      error: null,
    });
    (supabase.storage.from as any).mockReturnValue({ upload, createSignedUrl });

    const blob = new Blob(["nome\nA"], { type: "text/csv" });
    const resultado = await uploadCsvParaStorage(blob, "motoristas.csv");

    expect(resultado.url).toMatch(/^https:\/\//);
    expect(resultado.caminhoStorage).toMatch(/^user-123\//);
    expect(upload).toHaveBeenCalledTimes(1);
    expect(createSignedUrl).toHaveBeenCalledWith(
      expect.stringMatching(/^user-123\//),
      expect.any(Number),
      expect.objectContaining({ download: "motoristas.csv" }),
    );
  });

  it("lança erro claro quando sessão expirou", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null }, error: null });
    await expect(uploadCsvParaStorage(new Blob([""]), "x.csv")).rejects.toThrow(/Sessão expirada/);
  });
});

describe("gerarCsvMotoristas", () => {
  it("gera CSV com BOM UTF-8 e cabeçalho correto", async () => {
    const blob = gerarCsvMotoristas([
      {
        id: "1",
        name: "[MOTORISTA] João",
        cpf: "12345678901",
        phone: "11999999999",
        email: null,
        branch_name: "São Paulo",
        points_balance: 100,
        total_ride_points: 50,
        total_rides: 5,
        customer_tier: "OURO",
        scoring_disabled: false,
      } as any,
    ]);
    const texto = await blob.text();
    expect(texto.charCodeAt(0)).toBe(0xfeff); // BOM
    expect(texto).toContain('"Nome"');
    expect(texto).toContain('"João"');
    expect(texto).toContain('"123.456.789-01"');
  });
});