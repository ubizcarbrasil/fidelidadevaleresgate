import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AbaArtilharia from "./AbaArtilharia";

vi.mock("../../hooks/hook_artilharia", () => ({
  useTopRiders: vi.fn(),
}));

vi.mock("./ModalDetalhesMotorista", () => ({
  __esModule: true,
  default: () => null,
}));

import { useTopRiders } from "../../hooks/hook_artilharia";

function mockRiders(riders: any[]) {
  (useTopRiders as any).mockReturnValue({
    data: riders,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  });
}

const BASE_RIDER = {
  driver_id: "drv-1",
  driver_name: "João Silva",
  photo_url: null,
  total_rides: 42,
};

describe("AbaArtilharia — badge de prêmio", () => {
  it("mostra o badge de prêmio quando o toggle está ligado e o motorista é 1º colocado", () => {
    mockRiders([
      { ...BASE_RIDER, rank: 1, has_prize: true, prize_label: "R$ 500" },
      { ...BASE_RIDER, driver_id: "drv-2", rank: 2, has_prize: false, prize_label: null },
    ]);

    render(<AbaArtilharia brandId="b1" seasonId="s1" driverId={null} />);

    expect(screen.getByText("R$ 500")).toBeInTheDocument();
    expect(screen.getByText("R$ 500").closest("span")).toHaveClass("bg-emerald-500/15");
  });

  it("não mostra o badge quando o toggle está desligado (has_prize = false)", () => {
    mockRiders([
      { ...BASE_RIDER, rank: 1, has_prize: false, prize_label: null },
      { ...BASE_RIDER, driver_id: "drv-2", rank: 2, has_prize: false, prize_label: null },
    ]);

    render(<AbaArtilharia brandId="b1" seasonId="s1" driverId={null} />);

    expect(screen.queryByText("Prêmio")).not.toBeInTheDocument();
    expect(screen.queryByText("R$ 500")).not.toBeInTheDocument();
  });

  it("não mostra o badge para motoristas que não são o 1º colocado, mesmo que has_prize seja true", () => {
    mockRiders([
      { ...BASE_RIDER, rank: 1, has_prize: true, prize_label: "R$ 500" },
      { ...BASE_RIDER, driver_id: "drv-2", rank: 2, has_prize: true, prize_label: "Vale-combustível" },
    ]);

    render(<AbaArtilharia brandId="b1" seasonId="s1" driverId={null} />);

    expect(screen.getByText("R$ 500")).toBeInTheDocument();
    expect(screen.queryByText("Vale-combustível")).not.toBeInTheDocument();
  });

  it("exibe o texto 'Prêmio' como fallback quando prize_label está vazio ou null", () => {
    mockRiders([
      { ...BASE_RIDER, rank: 1, has_prize: true, prize_label: null },
    ]);

    render(<AbaArtilharia brandId="b1" seasonId="s1" driverId={null} />);

    expect(screen.getByText("Prêmio")).toBeInTheDocument();
    expect(screen.getByText("Prêmio").closest("span")).toHaveClass("bg-emerald-500/15");
  });

  it("exibe o prize_label personalizado quando fornecido", () => {
    mockRiders([
      { ...BASE_RIDER, rank: 1, has_prize: true, prize_label: "Vale-combustível R$ 100" },
    ]);

    render(<AbaArtilharia brandId="b1" seasonId="s1" driverId={null} />);

    expect(screen.getByText("Vale-combustível R$ 100")).toBeInTheDocument();
  });
});
