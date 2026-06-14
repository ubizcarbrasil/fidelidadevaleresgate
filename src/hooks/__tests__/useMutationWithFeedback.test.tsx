/**
 * useMutationWithFeedback — wrapper de useMutation com toast + haptics.
 * Bug aqui = mutation sucede mas usuário não tem feedback (toast/haptic),
 * ou erro mostra mensagem genérica em vez de error.message detalhado.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const { mockToastSuccess, mockToastError, mockHapticsMedium, mockHapticsError } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
  mockHapticsMedium: vi.fn(),
  mockHapticsError: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

vi.mock("@/lib/haptics", () => ({
  haptics: { medium: mockHapticsMedium, error: mockHapticsError },
}));

import { useMutationWithFeedback } from "../useMutationWithFeedback";

function wrap(): { wrapper: (p: { children: ReactNode }) => JSX.Element } {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return {
    wrapper: ({ children }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    ),
  };
}

beforeEach(() => {
  mockToastSuccess.mockReset();
  mockToastError.mockReset();
  mockHapticsMedium.mockReset();
  mockHapticsError.mockReset();
});

describe("useMutationWithFeedback — sucesso", () => {
  it("successMessage: toast.success + haptics.medium + onSuccessCallback", async () => {
    const callback = vi.fn();
    const fn = vi.fn().mockResolvedValue("done");

    const { result } = renderHook(
      () =>
        useMutationWithFeedback(fn, {
          successMessage: "Salvo com sucesso!",
          onSuccessCallback: callback,
        }),
      wrap(),
    );

    await act(async () => {
      await result.current.mutateAsync({ id: 1 } as never);
    });

    expect(mockToastSuccess).toHaveBeenCalledWith("Salvo com sucesso!");
    expect(mockHapticsMedium).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledOnce();
  });

  it("sem successMessage: NÃO chama toast.success mas chama haptics", async () => {
    const fn = vi.fn().mockResolvedValue("done");
    const { result } = renderHook(
      () => useMutationWithFeedback(fn),
      wrap(),
    );

    await act(async () => {
      await result.current.mutateAsync(null as never);
    });

    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(mockHapticsMedium).toHaveBeenCalledOnce();
  });

  it("sem onSuccessCallback: não throw", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const { result } = renderHook(
      () => useMutationWithFeedback(fn, { successMessage: "ok" }),
      wrap(),
    );
    await act(async () => {
      await result.current.mutateAsync(undefined as never);
    });
    expect(mockToastSuccess).toHaveBeenCalled();
  });
});

describe("useMutationWithFeedback — erro", () => {
  it("error.message presente: toast.error com mensagem + haptics.error", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("Falha específica"));
    const { result } = renderHook(
      () => useMutationWithFeedback(fn),
      wrap(),
    );

    await expect(
      result.current.mutateAsync(null as never),
    ).rejects.toThrow("Falha específica");

    expect(mockToastError).toHaveBeenCalledWith("Falha específica");
    expect(mockHapticsError).toHaveBeenCalledOnce();
    expect(mockHapticsMedium).not.toHaveBeenCalled();
  });

  it("error sem message: usa errorMessage default", async () => {
    const errSemMsg = new Error("");
    Object.defineProperty(errSemMsg, "message", { value: "" });
    const fn = vi.fn().mockRejectedValue(errSemMsg);
    const { result } = renderHook(
      () =>
        useMutationWithFeedback(fn, { errorMessage: "Custom error fallback" }),
      wrap(),
    );

    await expect(
      result.current.mutateAsync(null as never),
    ).rejects.toThrow();

    expect(mockToastError).toHaveBeenCalledWith("Custom error fallback");
  });

  it("sem errorMessage custom + error sem msg: default 'Ocorreu um erro'", async () => {
    const errSemMsg = new Error("");
    Object.defineProperty(errSemMsg, "message", { value: "" });
    const fn = vi.fn().mockRejectedValue(errSemMsg);
    const { result } = renderHook(
      () => useMutationWithFeedback(fn),
      wrap(),
    );

    await expect(
      result.current.mutateAsync(null as never),
    ).rejects.toThrow();

    expect(mockToastError.mock.calls[0][0]).toContain("Ocorreu um erro");
  });
});
