import { Navigate } from "react-router-dom";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useFormatoEngajamento } from "../hooks/hook_formato_engajamento";
import { TelaCarregamentoInline } from "@/compartilhados/components/tela_carregamento";

interface PropriedadesGuarda {
  /**
   * Formatos permitidos para acessar a rota.
   * Ex: ["duelo", "mass_duel"] bloqueia rotas legadas quando o formato é "campeonato".
   */
  formatosPermitidos: Array<"duelo" | "mass_duel" | "campeonato">;
  /** Rota de redirecionamento quando o formato atual é incompatível. */
  redirectTo?: string;
  children: React.ReactNode;
}

/**
 * Bloqueia rotas legadas (Duelos, Ranking, Cinturão, Apostas) quando a marca
 * está configurada com formato `campeonato`, e vice-versa.
 */
export default function GuardaFormatoEngajamento({
  formatosPermitidos,
  redirectTo = "/gamificacao-admin",
  children,
}: PropriedadesGuarda) {
  const { currentBrandId } = useBrandGuard();
  const { formato, isLoading } = useFormatoEngajamento(currentBrandId);

  if (isLoading) return <TelaCarregamentoInline />;

  if (!formatosPermitidos.includes(formato)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}