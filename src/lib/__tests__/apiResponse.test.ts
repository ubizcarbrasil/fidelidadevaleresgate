import { describe, it, expect, vi } from "vitest";
import { callEdgeFunction, apiOk, apiError } from "../apiResponse";

describe("callEdgeFunction", () => {
  it("returns structured response when edge function returns { ok, data }", async () => {
    const client = {
      functions: {
        invoke: vi.fn().mockResolvedValue({
          data: { ok: true, data: { points: 100 } },
          error: null,
        }),
      },
    };
    const res = await callEdgeFunction(client, "test-fn", { id: "1" });
    expect(res.ok).toBe(true);
    expect(res.data).toEqual({ points: 100 });
  });

  it("wraps legacy format in standard envelope", async () => {
    const client = {
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: [1, 2, 3], error: null }),
      },
    };
    const res = await callEdgeFunction(client, "test-fn");
    expect(res.ok).toBe(true);
    expect(res.data).toEqual([1, 2, 3]);
  });

  it("returns error when invoke fails", async () => {
    const client = {
      functions: {
        invoke: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Timeout" },
        }),
      },
    };
    const res = await callEdgeFunction(client, "test-fn");
    expect(res.ok).toBe(false);
    expect(res.code).toBe("INVOKE_ERROR");
  });

  it("returns NETWORK_ERROR on exception", async () => {
    const client = {
      functions: {
        invoke: vi.fn().mockRejectedValue(new Error("fetch failed")),
      },
    };
    const res = await callEdgeFunction(client, "test-fn");
    expect(res.ok).toBe(false);
    expect(res.code).toBe("NETWORK_ERROR");
    expect(res.error).toBe("fetch failed");
  });
});

describe("apiOk", () => {
  it("returns JSON response with ok: true", async () => {
    const response = apiOk({ items: [1] });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data).toEqual({ items: [1] });
  });

  it("accepts custom status and cors headers", async () => {
    const response = apiOk("created", 201, { "Access-Control-Allow-Origin": "*" });
    expect(response.status).toBe(201);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});

describe("apiError", () => {
  it("returns JSON response with ok: false", async () => {
    const response = apiError("Not found", "NOT_FOUND", 404);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("Not found");
    expect(body.code).toBe("NOT_FOUND");
  });
});
