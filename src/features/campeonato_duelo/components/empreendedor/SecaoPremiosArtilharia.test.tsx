import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SecaoPremiosArtilharia from "./SecaoPremiosArtilharia";

const mockSelect = vi.fn().mockResolvedValue({ data: [], error: null });
const mockEq = vi.fn().mockReturnThis();
const mockUpsert = vi.fn().mockReturnThis();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      eq: mockEq,
      upsert: mockUpsert,
    })),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe("SecaoPremiosArtilharia — estados de erro e carregamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReset().mockResolvedValue({ data: [], error: null });
    mockEq.mockReset().mockReturnThis();
    mockUpsert.mockReset().mockReturnThis();
  });

  it("exibe spinner de carregamento inicial", () => {
    mockSelect.mockReturnValue(new Promise(() => {}));

    render(<SecaoPremiosArtilharia seasonId="season-1" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/Carregando configurações/i)).toBeInTheDocument();
  });

  it("exibe mensagem de erro RLS quando o carregamento falha por permissão", async () => {
    mockSelect.mockRejectedValue({
      message: "new row violates row-level security policy",
    });

    render(<SecaoPremiosArtilharia seasonId="season-1" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(
        screen.getByText(/Você não tem permissão para visualizar/i),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: /Tentar novamente/i }),
    ).toBeInTheDocument();
  });

  it("exibe mensagem de erro de rede quando o carregamento falha por conexão", async () => {
    mockSelect.mockRejectedValue({
      message: "Failed to fetch",
    });

    render(<SecaoPremiosArtilharia seasonId="season-1" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(
        screen.getByText(/Erro de rede ao carregar configurações/i),
      ).toBeInTheDocument(),
    );
  });
});
