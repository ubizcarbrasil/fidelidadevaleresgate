import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SecaoPremiosArtilharia from "./SecaoPremiosArtilharia";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      eq: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
    }),
  },
}));

describe("SecaoPremiosArtilharia — estados de erro e carregamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("exibe spinner de carregamento inicial", async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue(new Promise(() => {})),
    });

    render(<SecaoPremiosArtilharia seasonId="season-1" />, { wrapper });

    expect(screen.getByText(/Carregando configurações/i)).toBeInTheDocument();
  });

  it("exibe mensagem de erro RLS quando o carregamento falha por permissão", async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockRejectedValue({
        message: "new row violates row-level security policy",
      }),
    });

    render(<SecaoPremiosArtilharia seasonId="season-1" />, { wrapper });

    await waitFor(() =>
      expect(
        screen.getByText(/Você não tem permissão para visualizar/i),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /Tentar novamente/i })).toBeInTheDocument();
  });

  it("exibe mensagem de erro de rede quando o carregamento falha por conexão", async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockRejectedValue({
        message: "Failed to fetch",
      }),
    });

    render(<SecaoPremiosArtilharia seasonId="season-1" />, { wrapper });

    await waitFor(() =>
      expect(
        screen.getByText(/Erro de rede ao carregar configurações/i),
      ).toBeInTheDocument(),
    );
  });
});
