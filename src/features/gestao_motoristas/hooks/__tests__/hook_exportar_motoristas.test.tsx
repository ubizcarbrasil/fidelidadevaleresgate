import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mocks dos módulos antes de importar o hook
vi.mock("sonner", () => ({
  toast: {
    loading: vi.fn(() => "toast-id"),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
  },
}));

vi.mock("../../services/servico_exportacao_motoristas", () => ({
  exportarTodosMotoristas: vi.fn(),
}));

vi.mock("../../utils/utilitarios_export_motoristas", () => ({
  gerarCsvMotoristas: vi.fn(() => new Blob(["csv"], { type: "text/csv" })),
  uploadCsvParaStorage: vi.fn(),
  abrirCsvPorUrl: vi.fn(),
  exigeUrlHttps: vi.fn(),
}));

import { useExportarMotoristas } from "../hook_exportar_motoristas";
import { exportarTodosMotoristas } from "../../services/servico_exportacao_motoristas";
import {
  uploadCsvParaStorage,
  abrirCsvPorUrl,
  exigeUrlHttps,
} from "../../utils/utilitarios_export_motoristas";
import { toast } from "sonner";

const PARAMS = {
  brandId: "brand-1",
  branchId: null,
  isBranchScope: false,
  busca: "",
  statusFiltro: "ALL" as const,
};

const RESULTADO_OK = {
  motoristas: [{ id: "1", name: "X" } as any],
  excedeuLimite: false,
};

const URL_ASSINADA = "https://storage.example.com/sign/abc?token=t";

describe("useExportarMotoristas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (uploadCsvParaStorage as any).mockResolvedValue({
      url: URL_ASSINADA,
      caminhoStorage: "user/abc.csv",
      expiraEm: new Date(),
    });
    (exportarTodosMotoristas as any).mockResolvedValue(RESULTADO_OK);
    (abrirCsvPorUrl as any).mockResolvedValue("download-direto");
  });

  it("Desktop: gera CSV, faz upload e abre URL imediatamente (sem arquivoPendente)", async () => {
    (exigeUrlHttps as any).mockReturnValue(false);

    const { result } = renderHook(() => useExportarMotoristas());
    await act(async () => {
      await result.current.exportar(PARAMS);
    });

    expect(uploadCsvParaStorage).toHaveBeenCalledTimes(1);
    expect(abrirCsvPorUrl).toHaveBeenCalledWith(URL_ASSINADA, expect.stringMatching(/^motoristas-/));
    expect(result.current.arquivoPendente).toBe(false);
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("exportados"));
  });

  it("iOS/PWA: 1º toque guarda arquivoPendente com URL HTTPS, NÃO chama abrirCsvPorUrl", async () => {
    (exigeUrlHttps as any).mockReturnValue(true);

    const { result } = renderHook(() => useExportarMotoristas());
    await act(async () => {
      await result.current.exportar(PARAMS);
    });

    expect(uploadCsvParaStorage).toHaveBeenCalledTimes(1);
    expect(abrirCsvPorUrl).not.toHaveBeenCalled();
    expect(result.current.arquivoPendente).toBe(true);
    expect(result.current.arquivoPendenteDetalhes?.url).toBe(URL_ASSINADA);
    // Garante que o estado pendente NUNCA carrega blob: URL.
    expect(result.current.arquivoPendenteDetalhes?.url).toMatch(/^https:\/\//);
  });

  it("iOS/PWA: 2º toque consome a URL pronta e limpa arquivoPendente (regressão tela branca)", async () => {
    (exigeUrlHttps as any).mockReturnValue(true);
    (abrirCsvPorUrl as any).mockResolvedValue("url-https");

    const { result } = renderHook(() => useExportarMotoristas());

    // 1º toque: prepara
    await act(async () => {
      await result.current.exportar(PARAMS);
    });
    expect(result.current.arquivoPendente).toBe(true);

    // 2º toque: consome
    await act(async () => {
      await result.current.exportar(PARAMS);
    });

    expect(abrirCsvPorUrl).toHaveBeenCalledTimes(1);
    expect(abrirCsvPorUrl).toHaveBeenCalledWith(URL_ASSINADA, expect.any(String));
    await waitFor(() => expect(result.current.arquivoPendente).toBe(false));
    // Confirma: a URL passada é HTTPS, nunca blob:
    expect((abrirCsvPorUrl as any).mock.calls[0][0]).toMatch(/^https:\/\//);
    expect((abrirCsvPorUrl as any).mock.calls[0][0]).not.toMatch(/^blob:/);
  });

  it("erro no upload mostra toast.error e NÃO deixa estado pendente", async () => {
    (exigeUrlHttps as any).mockReturnValue(true);
    (uploadCsvParaStorage as any).mockRejectedValue(new Error("Falha de rede"));

    const { result } = renderHook(() => useExportarMotoristas());
    await act(async () => {
      await result.current.exportar(PARAMS);
    });

    expect(toast.error).toHaveBeenCalledWith("Falha de rede");
    expect(result.current.arquivoPendente).toBe(false);
  });

  it("nenhum motorista para exportar: mostra warning e não tenta upload", async () => {
    (exportarTodosMotoristas as any).mockResolvedValue({ motoristas: [], excedeuLimite: false });

    const { result } = renderHook(() => useExportarMotoristas());
    await act(async () => {
      await result.current.exportar(PARAMS);
    });

    expect(toast.warning).toHaveBeenCalledWith("Nenhum motorista para exportar");
    expect(uploadCsvParaStorage).not.toHaveBeenCalled();
  });
});