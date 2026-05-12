import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SecaoPremiosArtilharia from "./SecaoPremiosArtilharia";

const mockSelect = vi.fn();
const mockFrom = vi.fn().mockReturnValue({
  select: mockSelect,
  eq: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mockFrom,
  },
}));

describe("SecaoPremiosArtilharia — estados de erro e carregamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe spinner de carregamento inicial", () => {
    mockSelect.mockReturnValue(new Promise(() => {}));

    render(<SecaoPremiosArtilharia seasonId="season-1" />);

    expect(screen.getByText(/Carregando configurações/i)).toBeInTheDocument();
  });

  it("exibe mensagem de erro RLS quando o carregamento falha por permissão", async () => {
    mockSelect.mockRejectedValue({
      message: "new row violates row-level security policy",
    });

    render(<SecaoPremiosArtilharia seasonId="season-1" />);

    await waitFor(() =>
      expect(
        screen.getByText(/Você não tem permissão para visualizar/i),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /Tentar novamente/i })).toBeInTheDocument();
  });

  it("exibe mensagem de erro de rede quando o carregamento falha por conexão", async () => {
    mockSelect.mockRejectedValue({
      message: "Failed to fetch",
    });

    render(<SecaoPremiosArtilharia seasonId="season-1" />);

    await waitFor(() =>
      expect(
        screen.getByText(/Erro de rede ao carregar configurações/i),
      ).toBeInTheDocument(),
    );
  });

  it("exibe mensagem de erro inline quando o upsert falha por RLS", async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });

    const upsertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    mockFrom.mockReturnValue({
      select: mockSelect,
      eq: vi.fn().mockReturnThis(),
      upsert: upsertMock,
    });

    render(<SecaoPremiosArtilharia seasonId="season-1" />);

    await waitFor(() =>
      expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /Salvar/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/Nada foi salvo — verifique suas permissões/i),
      ).toBeInTheDocument(),
    );
  });
});
