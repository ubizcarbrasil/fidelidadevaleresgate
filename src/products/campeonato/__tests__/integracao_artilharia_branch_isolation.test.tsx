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

const toastMock = vi.fn();
vi.mock("sonner", () => ({
  toast: { error: (...args: any[]) => toastMock(...args) },
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
    toastMock.mockClear();
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
      error: { message: "permission denied for relation campeonato_seasons" },
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
    toastMock.mockClear();
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

  it("ao alternar de janela com prêmio habilitado para desabilitada, o prize_label anterior desaparece da tela", async () => {
    // Primeira chamada (24h) — com prêmio habilitado
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          rank: 1,
          driver_id: "drv-1",
          driver_name: "João Silva",
          photo_url: null,
          total_rides: 50,
          has_prize: true,
          prize_label: "R$ 500 (diário)",
        },
      ],
      error: null,
    });

    // Segunda chamada (7d) — janela desabilitada
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          rank: 1,
          driver_id: "drv-1",
          driver_name: "João Silva",
          photo_url: null,
          total_rides: 120,
          has_prize: false,
          prize_label: null,
        },
      ],
      error: null,
    });

    renderizar();

    await waitFor(() =>
      expect(screen.getByText("R$ 500 (diário)")).toBeInTheDocument(),
    );

    // Troca para aba "7 dias" (desabilitada)
    const aba7d = screen.getByRole("button", { name: /7 dias/i });
    fireEvent.click(aba7d);

    await waitFor(() =>
      expect(screen.getByText((content) => content.includes("120") && content.includes("corridas"))).toBeInTheDocument(),
    );

    // Prize_label anterior deve ter sumido
    expect(screen.queryByText("R$ 500 (diário)")).not.toBeInTheDocument();
    expect(screen.queryByText("Prêmio")).not.toBeInTheDocument();
  });

  it("ao alternar de janela desabilitada para habilitada, o prize_label aparece sem misturar valores anteriores", async () => {
    // Primeira chamada (24h) — janela desabilitada
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

    // Segunda chamada (7d) — janela habilitada com prêmio
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          rank: 1,
          driver_id: "drv-1",
          driver_name: "João Silva",
          photo_url: null,
          total_rides: 120,
          has_prize: true,
          prize_label: "R$ 300 (semanal)",
        },
      ],
      error: null,
    });

    renderizar();

    await waitFor(() => expect(screen.getByText("João Silva")).toBeInTheDocument());
    // Inicialmente sem badge (janela desabilitada)
    expect(screen.queryByText("Prêmio")).not.toBeInTheDocument();
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();

    // Troca para aba "7 dias" (habilitada)
    const aba7d = screen.getByRole("button", { name: /7 dias/i });
    fireEvent.click(aba7d);

    await waitFor(() =>
      expect(screen.getByText("R$ 300 (semanal)")).toBeInTheDocument(),
    );

    // Verifica que o badge aparece com o novo prize_label correto
    const joaoRow = screen.getByText("João Silva").closest("button");
    expect(joaoRow).toHaveTextContent("R$ 300 (semanal)");

    // Confirma que nenhum valor residual ou texto fallback "Prêmio" misturou
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

  it("exibe o badge e o texto Prêmio apenas quando motorista é rank 1 e has_prize=true, mostrando o prize_label correspondente", async () => {
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

    // Rank 1 + has_prize=true deve exibir badge com prize_label
    expect(screen.getByText("Vale-combustível R$ 100")).toBeInTheDocument();

    // Verifica que o badge está no contexto do 1º colocado
    const joaoRow = screen.getByText("João Silva").closest("button");
    expect(joaoRow).toHaveTextContent("Vale-combustível R$ 100");

    // Rank 2 não deve ter badge
    const mariaRow = screen.getByText("Maria").closest("button");
    expect(mariaRow).not.toHaveTextContent("Vale-combustível R$ 100");
  });

  it("exibe o texto 'Prêmio' como fallback quando rank 1 tem has_prize=true mas prize_label é nulo", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          rank: 1,
          driver_id: "drv-1",
          driver_name: "João Silva",
          photo_url: null,
          total_rides: 50,
          has_prize: true,
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

    // Rank 1 + has_prize=true sem prize_label deve exibir "Prêmio"
    expect(screen.getByText("Prêmio")).toBeInTheDocument();

    const joaoRow = screen.getByText("João Silva").closest("button");
    expect(joaoRow).toHaveTextContent("Prêmio");

    // Rank 2 não deve ter badge nem texto "Prêmio"
    const mariaRow = screen.getByText("Maria").closest("button");
    expect(mariaRow).not.toHaveTextContent("Prêmio");
  });
});

describe("Integração — estado de carregamento e revelação do badge", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    toastMock.mockClear();
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

  it("ao alternar entre janelas, exibe spinner durante loading e só revela badge após RPC confirmar has_prize=true", async () => {
    // Primeira chamada (24h) — janela desabilitada
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

    // Segunda chamada (7d) — janela habilitada, mas delay para simular loading
    let resolver!: (value: { data: any[]; error: null }) => void;
    const promise = new Promise<{ data: any[]; error: null }>((resolve) => {
      resolver = resolve;
    });
    rpcMock.mockReturnValueOnce(promise);

    renderizar();

    await waitFor(() => expect(screen.getByText("João Silva")).toBeInTheDocument());
    // Janela 24h sem badge
    expect(screen.queryByText("Prêmio")).not.toBeInTheDocument();
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();

    // Troca para aba "7 dias"
    const aba7d = screen.getByRole("button", { name: /7 dias/i });
    fireEvent.click(aba7d);

    // Durante loading deve haver skeleton e nenhum badge
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(screen.queryByText("Prêmio")).not.toBeInTheDocument();
    expect(screen.queryByText("R$ 300 (semanal)")).not.toBeInTheDocument();

    // Agora resolve com has_prize=true
    resolver({
      data: [
        {
          rank: 1,
          driver_id: "drv-1",
          driver_name: "João Silva",
          photo_url: null,
          total_rides: 120,
          has_prize: true,
          prize_label: "R$ 300 (semanal)",
        },
      ],
      error: null,
    });

    // Após resolução, badge aparece e skeleton some
    await waitFor(() =>
      expect(screen.getByText("R$ 300 (semanal)")).toBeInTheDocument(),
    );
    expect(document.querySelector(".animate-pulse")).not.toBeInTheDocument();
    expect(screen.getByText("R$ 300 (semanal)").closest("span")).toHaveClass(
      "bg-emerald-500/15",
    );
  });

  it("ao alternar rapidamente entre abas, ignora resultado de RPC atrasado e renderiza apenas o mais recente", async () => {
    // Inicial (24h) — sem prêmio, para evitar cache de badge
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

    // Promise A — 7 dias (lenta, com prêmio)
    let resolverA!: (value: { data: any[]; error: null }) => void;
    const promiseA = new Promise<{ data: any[]; error: null }>((resolve) => {
      resolverA = resolve;
    });

    // Promise B — 15 dias (rápida, sem prêmio)
    let resolverB!: (value: { data: any[]; error: null }) => void;
    const promiseB = new Promise<{ data: any[]; error: null }>((resolve) => {
      resolverB = resolve;
    });

    // Override para retornar as promises nas chamadas corretas
    let callCount = 0;
    rpcMock.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return promiseA; // 7 dias
      if (callCount === 2) return promiseB; // 15 dias
      return Promise.resolve({ data: [], error: null });
    });

    renderizar();

    await waitFor(() => expect(screen.getByText("João Silva")).toBeInTheDocument());
    // 24h sem badge
    expect(screen.queryByText("Prêmio")).not.toBeInTheDocument();
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();

    // Clica em "7 dias" → inicia RPC lento (promise A)
    const aba7d = screen.getByRole("button", { name: /7 dias/i });
    fireEvent.click(aba7d);

    // Skeleton deve aparecer
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();

    // Antes de resolver, clica em "15 dias" → inicia RPC B
    const aba15d = screen.getByRole("button", { name: /15 dias/i });
    fireEvent.click(aba15d);

    // Resolve B primeiro (15 dias sem prêmio)
    resolverB({
      data: [
        {
          rank: 1,
          driver_id: "drv-1",
          driver_name: "João Silva",
          photo_url: null,
          total_rides: 80,
          has_prize: false,
          prize_label: null,
        },
      ],
      error: null,
    });

    await waitFor(() =>
      expect(screen.getByText((content) => content.includes("80") && content.includes("corridas"))).toBeInTheDocument(),
    );
    // UI deve mostrar 15 dias sem badge
    expect(screen.queryByText("Prêmio")).not.toBeInTheDocument();
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();

    // Agora resolve A (7 dias com prêmio) — deve ser ignorado
    resolverA({
      data: [
        {
          rank: 1,
          driver_id: "drv-1",
          driver_name: "João Silva",
          photo_url: null,
          total_rides: 200,
          has_prize: true,
          prize_label: "R$ 500 (7d)",
        },
      ],
      error: null,
    });

    // Aguarda um tick para garantir que não há atualização atrasada
    await new Promise((r) => setTimeout(r, 50));

    // Badge de 7 dias NÃO deve aparecer — UI mantém estado de 15 dias
    expect(screen.queryByText("R$ 500 (7d)")).not.toBeInTheDocument();
    expect(screen.queryByText("Prêmio")).not.toBeInTheDocument();
    // Corridas de 15 dias permanecem
    expect(
      screen.getByText((content) => content.includes("80") && content.includes("corridas")),
    ).toBeInTheDocument();
  });

  it("remove spinner/skeleton e não exibe badge ou prize_label quando o RPC falha", async () => {
    let rejecter!: (reason: any) => void;
    const promise = new Promise<{ data: any[]; error: null }>((_, reject) => {
      rejecter = reject;
    });
    rpcMock.mockReturnValue(promise);

    renderizar();

    // Durante o loading deve haver skeleton
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
    // Badge não deve existir durante o loading
    expect(screen.queryByText("Prêmio")).not.toBeInTheDocument();
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();

    // Rejeita a promise simulando erro no RPC
    rejecter(new Error("Falha na conexão com o servidor"));

    // Após a falha, skeleton deve sumir
    await waitFor(() =>
      expect(document.querySelector(".animate-pulse")).not.toBeInTheDocument(),
    );

    // Badge/prize_label não deve aparecer
    expect(screen.queryByText("Prêmio")).not.toBeInTheDocument();
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();

    // Mensagem de erro deve ser exibida
    expect(
      screen.getByText("Não foi possível carregar a artilharia."),
    ).toBeInTheDocument();
  });

  it("clicar em 'Tentar novamente' após erro dispara novo RPC e depois exibe badge/prize_label corretamente", async () => {
    // Primeira chamada: falha
    rpcMock.mockRejectedValueOnce(new Error("Falha na conexão com o servidor"));

    // Segunda chamada (após refetch): sucesso com prêmio
    let resolverRetry!: (value: { data: any[]; error: null }) => void;
    const promiseRetry = new Promise<{ data: any[]; error: null }>((resolve) => {
      resolverRetry = resolve;
    });
    rpcMock.mockReturnValueOnce(promiseRetry);

    renderizar();

    // Estado de erro inicial com botão de retry
    await waitFor(() =>
      expect(
        screen.getByText("Não foi possível carregar a artilharia."),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText("Prêmio")).not.toBeInTheDocument();
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();

    // Clica em "Tentar novamente"
    const btnRetry = screen.getByRole("button", { name: /Tentar novamente/i });
    fireEvent.click(btnRetry);

    // Resolve o retry com sucesso
    resolverRetry({
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

    // Após sucesso, mensagem de erro some e badge aparece
    await waitFor(() => expect(screen.getByText("R$ 500")).toBeInTheDocument());
    expect(
      screen.queryByText("Não foi possível carregar a artilharia."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("R$ 500").closest("span")).toHaveClass("bg-emerald-500/15");
  });

  it("dispara toast de erro quando o RPC falha e mantém área de badge vazia", async () => {
    rpcMock.mockRejectedValue(new Error("Erro no servidor"));

    renderizar();

    // Toast de erro deve ser disparado
    await waitFor(() => expect(toastMock).toHaveBeenCalled());
    expect(toastMock).toHaveBeenCalledWith("Erro ao carregar artilharia", {
      description: "Não foi possível atualizar o ranking. Tente novamente.",
    });

    // Badge/prize_label não devem aparecer
    expect(screen.queryByText("Prêmio")).not.toBeInTheDocument();
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
  });
});