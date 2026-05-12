import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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

function renderizar(seasonId = "season-A") {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <AbaArtilharia brandId="brand-A" seasonId={seasonId} driverId={null} />
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

describe("Integração — origem e condições do prize_label", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("não exibe badge quando motorista é rank 2 e backend retorna has_prize=false (prêmio só para 1º)", async () => {
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

    await waitFor(() => expect(screen.getByText("Maria")).toBeInTheDocument());
    // Rank 2 não deve ter badge, mesmo que o 1º tenha.
    const mariaRow = screen.getByText("Maria").closest("button");
    expect(mariaRow).not.toHaveTextContent("Prêmio");
    expect(mariaRow).not.toHaveTextContent("R$ 500");
  });

  it("o prize_label exibido vem do registro de prêmio habilitado da janela ativa", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          rank: 1,
          driver_id: "drv-1",
          driver_name: "João Silva",
          photo_url: null,
          total_rides: 50,
          has_prize: true,
          prize_label: "Vale-combustível R$ 100",
        },
      ],
      error: null,
    });

    renderizar();

    await waitFor(() =>
      expect(screen.getByText("Vale-combustível R$ 100")).toBeInTheDocument(),
    );
    expect(screen.queryByText("R$ 500")).not.toBeInTheDocument();
    expect(screen.queryByText("Prêmio")).not.toBeInTheDocument();
  });

  it("prize_label fica null / não renderizado quando a janela está desabilitada (has_prize=false para rank 1)", async () => {
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
      ],
      error: null,
    });

    renderizar();

    await waitFor(() => expect(screen.getByText("João Silva")).toBeInTheDocument());
    expect(screen.queryByText("Prêmio")).not.toBeInTheDocument();
    expect(screen.queryByText(/Vale-combustível/)).not.toBeInTheDocument();
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
  });

  it("ao trocar de janela, o prize_label reflete o valor da nova janela (se houver prêmio habilitado)", async () => {

    // Primeira chamada (24h) — sem prêmio
    rpcMock.mockResolvedValueOnce({
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
      ],
      error: null,
    });

    // Segunda chamada (7d) — com prêmio habilitado
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          rank: 1,
          driver_id: "drv-1",
          driver_name: "João Silva",
          photo_url: null,
          total_rides: 120,
          has_prize: true,
          prize_label: "R$ 200 (semanal)",
        },
      ],
      error: null,
    });

    renderizar();

    await waitFor(() => expect(screen.getByText("João Silva")).toBeInTheDocument());
    expect(screen.queryByText("Prêmio")).not.toBeInTheDocument();

    // Troca para aba "7 dias"
    const aba7d = screen.getByRole("button", { name: /7 dias/i });
    fireEvent.click(aba7d);

    await waitFor(() =>
      expect(screen.getByText("R$ 200 (semanal)")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Prêmio")).not.toBeInTheDocument();
  });

  it("prize_label vazado de outra filial não é renderizado quando has_prize=false (janela desabilitada)", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          rank: 1,
          driver_id: "drv-1",
          driver_name: "João Silva",
          photo_url: null,
          total_rides: 50,
          has_prize: false,
          prize_label: "R$ 500 (filial B)",
        },
      ],
      error: null,
    });

    renderizar();

    await waitFor(() => expect(screen.getByText("João Silva")).toBeInTheDocument());
    // Label de outra filial NÃO deve aparecer quando janela está desabilitada.
    expect(screen.queryByText("R$ 500 (filial B)")).not.toBeInTheDocument();
    expect(screen.queryByText("Prêmio")).not.toBeInTheDocument();
  });

  it("não exibe badge para motorista rank 3 mesmo que payload contenha prize_label residual", async () => {
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
        {
          rank: 3,
          driver_id: "drv-3",
          driver_name: "Pedro",
          photo_url: null,
          total_rides: 30,
          has_prize: false,
          prize_label: "R$ 100 (residual incorreto)",
        },
      ],
      error: null,
    });

    renderizar();

    await waitFor(() => expect(screen.getByText("Pedro")).toBeInTheDocument());
    const pedroRow = screen.getByText("Pedro").closest("button");
    expect(pedroRow).not.toHaveTextContent("R$ 100 (residual incorreto)");
    expect(pedroRow).not.toHaveTextContent("Prêmio");
  });
});

describe("Integração — estado de carregamento e revelação do badge", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("exibe spinner (Skeleton) enquanto o RPC está pendente e nenhum badge é mostrado", async () => {
    // Cria uma promise que fica pendente para simular loading.
    let resolver!: (value: { data: any[]; error: null }) => void;
    const promise = new Promise<{ data: any[]; error: null }>((resolve) => {
      resolver = resolve;
    });
    rpcMock.mockReturnValue(promise);

    renderizar();

    // Durante o loading deve haver skeletons (aria-busy implícito ou classes de skeleton).
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
    // Badge NÃO deve existir durante o loading.
    expect(screen.queryByText("R$ 500")).not.toBeInTheDocument();
    expect(screen.queryByText("Prêmio")).not.toBeInTheDocument();

    // Agora resolve com has_prize=true.
    resolver({
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

    await waitFor(() => expect(screen.getByText("R$ 500")).toBeInTheDocument());
    // Após a resolução, skeleton some.
    expect(document.querySelector(".animate-pulse")).not.toBeInTheDocument();
  });

  it("mantém badge oculto durante loading mesmo se o payload futuro contiver has_prize=true", async () => {
    let resolver!: (value: { data: any[]; error: null }) => void;
    const promise = new Promise<{ data: any[]; error: null }>((resolve) => {
      resolver = resolve;
    });
    rpcMock.mockReturnValue(promise);

    renderizar();

    // Loading ativo.
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(screen.queryByText("R$ 500")).not.toBeInTheDocument();

    resolver({
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

    await waitFor(() => expect(screen.getByText("R$ 500")).toBeInTheDocument());
    expect(screen.getByText("R$ 500").closest("span")).toHaveClass("bg-emerald-500/15");
  });

  it("mantém badge oculto após carregamento quando backend retorna has_prize=false", async () => {
    let resolver!: (value: { data: any[]; error: null }) => void;
    const promise = new Promise<{ data: any[]; error: null }>((resolve) => {
      resolver = resolve;
    });
    rpcMock.mockReturnValue(promise);

    renderizar();

    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();

    resolver({
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
      ],
      error: null,
    });

    await waitFor(() => expect(screen.getByText("João Silva")).toBeInTheDocument());
    // Após carregamento, sem badge.
    expect(screen.queryByText("Prêmio")).not.toBeInTheDocument();
    expect(screen.queryByText("R$ 500")).not.toBeInTheDocument();
  });
});