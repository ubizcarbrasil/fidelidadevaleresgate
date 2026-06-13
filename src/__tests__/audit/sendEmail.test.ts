/**
 * `_shared/email.ts` sendEmail — wrapper Resend usado por:
 *   - otpHelpers.sendOtpEmail (auth)
 *   - trial-reminders-cron (subscription growth)
 *   - futuros transactional emails
 *
 * Bug aqui = emails de OTP não saem (login motorista quebra) OU
 * emails de trial reminder não saem (churn silencioso).
 *
 * Testa contratos sem rede real:
 *   1. Sem RESEND_API_KEY: retorna sent=false silencioso (DEV mode)
 *   2. Com key: faz POST pra api.resend.com com headers/body corretos
 *   3. Resposta não-ok: marca provider="resend_error", não throw
 *   4. fetch throw: marca provider="resend_exception", não propaga
 *   5. from default + overrides (env var, opts.from)
 *   6. Tag opcional aparece nos logs
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock global Deno antes de importar o módulo
const envStore: Record<string, string | undefined> = {};
beforeEach(() => {
  for (const k of Object.keys(envStore)) delete envStore[k];
  // @ts-expect-error — global Deno injetado pra carregar módulo Deno no Node
  globalThis.Deno = { env: { get: (k: string) => envStore[k] } };
  vi.restoreAllMocks();
});

const importEmail = () => import("../../../supabase/functions/_shared/email.ts");

describe("sendEmail — env e fallback", () => {
  it("sem RESEND_API_KEY: retorna {sent:false, provider:'none'} sem chamar fetch", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { sendEmail } = await importEmail();
    const r = await sendEmail({ to: "x@y.com", subject: "s", html: "<p>h</p>" });
    expect(r).toEqual({ sent: false, provider: "none" });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("warning inclui a tag quando fornecida", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { sendEmail } = await importEmail();
    await sendEmail({ to: "x@y.com", subject: "s", html: "h", tag: "trial_7d" });
    expect(warnSpy.mock.calls[0][0]).toContain("trial_7d");
  });
});

describe("sendEmail — POST happy path", () => {
  beforeEach(() => {
    envStore.RESEND_API_KEY = "test-key-123";
  });

  it("POST pra api.resend.com com Bearer correto", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "rsnd-abc" }), { status: 200 }),
    );
    const { sendEmail } = await importEmail();
    const r = await sendEmail({
      to: "user@example.com",
      subject: "Hello",
      html: "<p>Hi</p>",
    });
    expect(r).toEqual({ sent: true, provider: "resend", id: "rsnd-abc" });

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer test-key-123",
    );
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json",
    );
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({
      to: "user@example.com",
      subject: "Hello",
      html: "<p>Hi</p>",
    });
  });

  it("aceita 'to' como array (multi-recipient)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 }),
    );
    const { sendEmail } = await importEmail();
    await sendEmail({
      to: ["a@x.com", "b@x.com"],
      subject: "S",
      html: "H",
    });
    const body = JSON.parse((fetchSpy.mock.calls[0] as any)[1].body);
    expect(body.to).toEqual(["a@x.com", "b@x.com"]);
  });

  it("body sem id da Resend: sent=true mas id undefined", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 }),
    );
    const { sendEmail } = await importEmail();
    const r = await sendEmail({ to: "x@y.com", subject: "s", html: "h" });
    expect(r.sent).toBe(true);
    expect(r.provider).toBe("resend");
    expect(r.id).toBeUndefined();
  });

  it("body inválido JSON: ainda retorna sent=true (graceful)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("not-json", { status: 200 }),
    );
    const { sendEmail } = await importEmail();
    const r = await sendEmail({ to: "x@y.com", subject: "s", html: "h" });
    expect(r.sent).toBe(true);
  });
});

describe("sendEmail — from resolution", () => {
  beforeEach(() => {
    envStore.RESEND_API_KEY = "k";
  });

  it("usa opts.from quando passado (prioridade máxima)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 }),
    );
    const { sendEmail } = await importEmail();
    await sendEmail({
      to: "x@y.com", subject: "s", html: "h",
      from: "explicit@brand.com",
    });
    const body = JSON.parse((fetchSpy.mock.calls[0] as any)[1].body);
    expect(body.from).toBe("explicit@brand.com");
  });

  it("usa TRIAL_FROM_EMAIL se opts.from ausente", async () => {
    envStore.TRIAL_FROM_EMAIL = "trial@brand.com";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 }),
    );
    const { sendEmail } = await importEmail();
    await sendEmail({ to: "x@y.com", subject: "s", html: "h" });
    const body = JSON.parse((fetchSpy.mock.calls[0] as any)[1].body);
    expect(body.from).toBe("trial@brand.com");
  });

  it("usa OTP_FROM_EMAIL se TRIAL_FROM_EMAIL ausente", async () => {
    envStore.OTP_FROM_EMAIL = "otp@brand.com";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 }),
    );
    const { sendEmail } = await importEmail();
    await sendEmail({ to: "x@y.com", subject: "s", html: "h" });
    const body = JSON.parse((fetchSpy.mock.calls[0] as any)[1].body);
    expect(body.from).toBe("otp@brand.com");
  });

  it("hardcoded default quando nenhuma env nem opts.from", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 }),
    );
    const { sendEmail } = await importEmail();
    await sendEmail({ to: "x@y.com", subject: "s", html: "h" });
    const body = JSON.parse((fetchSpy.mock.calls[0] as any)[1].body);
    expect(body.from).toBe("no-reply@valeresgate.com.br");
  });

  it("opts.from tem precedência sobre TRIAL_FROM_EMAIL", async () => {
    envStore.TRIAL_FROM_EMAIL = "env@brand.com";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 }),
    );
    const { sendEmail } = await importEmail();
    await sendEmail({
      to: "x@y.com", subject: "s", html: "h",
      from: "opts@brand.com",
    });
    const body = JSON.parse((fetchSpy.mock.calls[0] as any)[1].body);
    expect(body.from).toBe("opts@brand.com");
  });
});

describe("sendEmail — error handling", () => {
  beforeEach(() => {
    envStore.RESEND_API_KEY = "k";
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("HTTP 4xx: provider='resend_error', sent=false, não throw", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Invalid recipient", { status: 422 }),
    );
    const { sendEmail } = await importEmail();
    const r = await sendEmail({ to: "x@y.com", subject: "s", html: "h" });
    expect(r).toEqual({ sent: false, provider: "resend_error" });
  });

  it("HTTP 5xx: provider='resend_error'", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Server burning", { status: 503 }),
    );
    const { sendEmail } = await importEmail();
    const r = await sendEmail({ to: "x@y.com", subject: "s", html: "h" });
    expect(r.provider).toBe("resend_error");
  });

  it("fetch throw (network error): provider='resend_exception'", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));
    const { sendEmail } = await importEmail();
    const r = await sendEmail({ to: "x@y.com", subject: "s", html: "h" });
    expect(r).toEqual({ sent: false, provider: "resend_exception" });
  });

  it("erro com tag: log inclui a tag pra diagnóstico", async () => {
    const errSpy = vi.spyOn(console, "error");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("nope", { status: 500 }),
    );
    const { sendEmail } = await importEmail();
    await sendEmail({
      to: "x@y.com", subject: "s", html: "h",
      tag: "trial_0d",
    });
    const firstCall = errSpy.mock.calls[0][0] as string;
    expect(firstCall).toContain("trial_0d");
  });
});
