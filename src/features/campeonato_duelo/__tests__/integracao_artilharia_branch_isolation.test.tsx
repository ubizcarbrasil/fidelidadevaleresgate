import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock supabase client at the integration boundary (RPC layer).
const rpcMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: any[]) => rpcMock(...args),
  },
}));

vi.mock("../components/motorista/ModalDetalhesMotorista", () => ({
  __esModule: true,
  default: () => null,
}));

import AbaArtilharia from "../components/motorista/AbaArtilharia";

function renderizar() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <AbaArtilharia brandId="brand-A" seasonId="season-A" driverId={null} />
    </QueryClientProvider>,
  );
}

describe("Integração — isolamento por branch_id na Artilharia", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("o serviço chama o RPC apenas com season_id e window — sem permitir override de branch_id pelo cliente", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });

    renderizar();

    await waitFor(() => expect(rpcMock).toHaveBeenCalled());
    const [fnName, params] = rpcMock.mock.calls[0];
    expect(fnName).toBe("driver_get_top_riders");
    expect(params).toEqual({ p_season_id: "season-A", p_window: "24h" });
    // Nunca expor branch_id no payload — isolamento é responsabilidade do backend.
    expect(Object.keys(params)).not.toContain("p_branch_id");
    expect(Object.keys(params)).not.toContain("branch_id");
  });

  it("não exibe o badge quando o backend retorna o 1º colocado com has_prize=false (isolamento cross-branch aplicado pelo RPC)", async () => {
    // Simula payload em que o RPC, devido ao isolamento por branch_id,
    // suprimiu o prêmio mesmo para o 1º colocado (janela desativada na branch correta
    // ou prêmio configurado em outra branch).
    rpcMock.mockResolvedValue({
      data: [
        {
          rank: 1,
          driver_id: "drv-1",
          driver_name: "João Silva",
          photo_url: null,
          total_rides: 50,
          has_prize: false,
          prize_label: null,
        },
        {
          rank: 2,
          driver_id: "drv-2",
          driver_name: "Maria",
          photo_url: null,
          total_rides: 40,
          has_prize: false,
          prize_label: null,
        },
      ],
      error: null,
    });

    renderizar();

    await waitFor(() => expect(screen.getByText("João Silva")).toBeInTheDocument());
    expect(screen.queryByText("Prêmio")).not.toBeInTheDocument();
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
  });

  it("a UI confia 100% no flag has_prize do backend — não infere prêmio a partir de rank=1", async () => {
    // Mesmo com rank=1 e prize_label vindo no payload, se has_prize=false (backend
    // negou por estar fora da branch correta), a UI NÃO deve renderizar o badge.
    rpcMock.mockResolvedValue({
      data: [
        {
          rank: 1,
          driver_id: "drv-cross",
          driver_name: "Motorista Cross-Branch",
          photo_url: null,
          total_rides: 99,
          has_prize: false,
          prize_label: "R$ 9999 (de outra filial)",
        },
      ],
      error: null,
    });

    renderizar();

    await waitFor(() =>
      expect(screen.getByText("Motorista Cross-Branch")).toBeInTheDocument(),
    );
    // Label vazado no payload NÃO pode ser renderizado quando has_prize=false.
    expect(
      screen.queryByText("R$ 9999 (de outra filial)"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Prêmio")).not.toBeInTheDocument();
  });

  it("exibe o badge apenas quando o backend confirma has_prize=true (branch correta)", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          rank: 1,
          driver_id: "drv-1",
          driver_name: "João Silva",
          photo_url: null,
          total_rides: 50,
          has_prize: true,
          prize_label: "R$ 500",
        },
      ],
      error: null,
    });

    renderizar();

    await waitFor(() => expect(screen.getByText("R$ 500")).toBeInTheDocument());
    expect(screen.getByText("R$ 500").closest("span")).toHaveClass(
      "bg-emerald-500/15",
    );
  });

  it("propaga erro do RPC sem renderizar badges de outras branches em fallback", async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: "permission denied for relation duelo_seasons" },
    });

    renderizar();

    await waitFor(() =>
      expect(
        screen.getByText("Não foi possível carregar a artilharia."),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText("Prêmio")).not.toBeInTheDocument();
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
  });
});