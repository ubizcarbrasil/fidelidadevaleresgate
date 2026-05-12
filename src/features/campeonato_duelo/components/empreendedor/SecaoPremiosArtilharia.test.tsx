import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SecaoPremiosArtilharia from "./SecaoPremiosArtilharia";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      eq: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
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
  });

  it("exibe spinner de carregamento inicial", () => {
    const { supabase } = require("@/integrations/supabase/client");
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue(new Promise(() => {})),
      eq: vi.fn().mockReturnThis(),
    });

    render(<SecaoPremiosArtilharia seasonId="season-1" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/Carregando configurações/i)).toBeInTheDocument();
  });

  it("exibe mensagem de erro RLS quando o carregamento falha por permissão", async () => {
    const { supabase } = require("@/integrations/supabase/client");
    supabase.from.mockReturnValue({
      select: vi.fn().mockRejectedValue({
        message: "new row violates row-level security policy",
      }),
      eq: vi.fn().mockReturnThis(),
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
    const { supabase } = require("@/integrations/supabase/client");
    supabase.from.mockReturnValue({
      select: vi.fn().mockRejectedValue({
        message: "Failed to fetch",
      }),
      eq: vi.fn().mockReturnThis(),
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
