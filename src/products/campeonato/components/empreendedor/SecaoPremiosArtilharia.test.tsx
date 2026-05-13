import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SecaoPremiosArtilharia from "./SecaoPremiosArtilharia";

const mockedUseQuery = vi.fn();

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: (...args: any[]) => mockedUseQuery(...args),
  };
});

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
    mockedUseQuery.mockReset();
  });

  it("exibe spinner de carregamento inicial", () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<SecaoPremiosArtilharia seasonId="season-1" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/Carregando configurações/i)).toBeInTheDocument();
  });

  it("exibe mensagem de erro RLS quando o carregamento falha por permissão", () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { message: "new row violates row-level security policy" },
      refetch: vi.fn(),
    });

    render(<SecaoPremiosArtilharia seasonId="season-1" />, {
      wrapper: createWrapper(),
    });

    expect(
      screen.getByText(/Você não tem permissão para visualizar/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Tentar novamente/i }),
    ).toBeInTheDocument();
  });

  it("exibe mensagem de erro de rede quando o carregamento falha por conexão", () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { message: "Failed to fetch" },
      refetch: vi.fn(),
    });

    render(<SecaoPremiosArtilharia seasonId="season-1" />, {
      wrapper: createWrapper(),
    });

    expect(
      screen.getByText(/Erro de rede ao carregar configurações/i),
    ).toBeInTheDocument();
  });
});
