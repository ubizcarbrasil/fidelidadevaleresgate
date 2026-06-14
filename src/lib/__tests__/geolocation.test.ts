/**
 * geolocation — getCurrentPosition wrapper (graceful sem geo) + distanceKm
 * (haversine) usado em findNearestBranch e auto-detect de filial.
 * Bug aqui = browser sem geo crasha (getCurrentPosition em null),
 * haversine retorna NaN com coords inválidos, timeout sem retorno.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCurrentPosition, distanceKm } from "../geolocation";

describe("distanceKm — haversine", () => {
  // Coords reais com distâncias conhecidas
  const SP = { latitude: -23.5505, longitude: -46.6333 };
  const RJ = { latitude: -22.9068, longitude: -43.1729 };
  const BSB = { latitude: -15.7942, longitude: -47.8822 };

  it("ponto igual: distância 0", () => {
    expect(distanceKm(SP, SP)).toBe(0);
  });

  it("SP → RJ: ~360km (±20km tolerância)", () => {
    const d = distanceKm(SP, RJ);
    expect(d).toBeGreaterThan(340);
    expect(d).toBeLessThan(380);
  });

  it("SP → BSB: ~870km (±30km tolerância)", () => {
    const d = distanceKm(SP, BSB);
    expect(d).toBeGreaterThan(840);
    expect(d).toBeLessThan(900);
  });

  it("simetria: dist(A,B) === dist(B,A)", () => {
    expect(distanceKm(SP, RJ)).toBeCloseTo(distanceKm(RJ, SP), 5);
  });
});

describe("getCurrentPosition", () => {
  beforeEach(() => {
    // Reset navigator.geolocation
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      writable: true,
      value: undefined,
    });
  });

  it("sem navigator.geolocation (browser velho): resolve null", async () => {
    const result = await getCurrentPosition();
    expect(result).toBeNull();
  });

  it("permissão concedida: retorna { latitude, longitude }", async () => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      writable: true,
      value: {
        getCurrentPosition: (success: (p: { coords: { latitude: number; longitude: number } }) => void) => {
          success({ coords: { latitude: -23.5, longitude: -46.6 } });
        },
      },
    });
    const result = await getCurrentPosition();
    expect(result).toEqual({ latitude: -23.5, longitude: -46.6 });
  });

  it("permissão negada (error callback): resolve null", async () => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      writable: true,
      value: {
        getCurrentPosition: (
          _success: unknown,
          error: (err: { code: number }) => void,
        ) => {
          error({ code: 1 }); // PERMISSION_DENIED
        },
      },
    });
    const result = await getCurrentPosition();
    expect(result).toBeNull();
  });

  it("timeoutMs custom: passa pras options", async () => {
    let receivedOptions: { timeout?: number } | undefined;
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      writable: true,
      value: {
        getCurrentPosition: (
          success: (p: { coords: { latitude: number; longitude: number } }) => void,
          _error: unknown,
          options: { timeout?: number },
        ) => {
          receivedOptions = options;
          success({ coords: { latitude: 0, longitude: 0 } });
        },
      },
    });
    await getCurrentPosition(5000);
    expect(receivedOptions?.timeout).toBe(5000);
  });
});
