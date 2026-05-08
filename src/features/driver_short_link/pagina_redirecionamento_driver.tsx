import { useEffect } from "react";
import { useParams, useLocation, Navigate } from "react-router-dom";

/**
 * Rota curta `/d/:brandId` que redireciona para `/driver?brandId=...`.
 * Existe para gerar links mais curtos e fáceis de copiar/colar dentro de
 * apps cujo WebView não detecta URLs longas como clicáveis (ex.: Ubiz Car).
 * Preserva qualquer query string adicional já presente no link curto.
 */
export default function PaginaRedirecionamentoDriver() {
  const { brandId } = useParams<{ brandId: string }>();
  const { search } = useLocation();

  useEffect(() => {
    document.title = "Abrindo ofertas...";
    // Garantia extra: dispara o import do painel do motorista assim que a
    // rota curta é montada, caso o prefetch do main.tsx não tenha sido
    // executado (ex.: navegação SPA interna sem reload).
    void import("@/pages/DriverPanelPage").catch(() => {});
  }, []);

  if (!brandId) return <Navigate to="/" replace />;

  const params = new URLSearchParams(search);
  params.set("brandId", brandId);
  return <Navigate to={`/driver?${params.toString()}`} replace />;
}