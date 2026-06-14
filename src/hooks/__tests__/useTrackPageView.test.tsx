/**
 * useTrackPageView — dispara $pageview no PostHog em SPA navigation.
 *
 * Bug aqui = analytics perde nav entre rotas (admin acha que usuários
 * só ficam na primeira página).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";

const { mockTrackPageView } = vi.hoisted(() => ({
  mockTrackPageView: vi.fn(),
}));

vi.mock("@/lib/analytics", () => ({
  trackPageView: mockTrackPageView,
}));

import { useTrackPageView } from "../useTrackPageView";

function wrapAt(path: string): { wrapper: (p: { children: ReactNode }) => JSX.Element } {
  return {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
    ),
  };
}

beforeEach(() => {
  mockTrackPageView.mockReset();
});

describe("useTrackPageView", () => {
  it("monta: dispara trackPageView com pathname inicial", () => {
    renderHook(() => useTrackPageView(), wrapAt("/customers"));
    expect(mockTrackPageView).toHaveBeenCalledWith("/customers");
  });

  it("inclui search params no path enviado", () => {
    renderHook(() => useTrackPageView(), wrapAt("/customers?page=2&q=x"));
    expect(mockTrackPageView).toHaveBeenCalledWith("/customers?page=2&q=x");
  });

  it("path '/': trackPageView('/')", () => {
    renderHook(() => useTrackPageView(), wrapAt("/"));
    expect(mockTrackPageView).toHaveBeenCalledWith("/");
  });
});
