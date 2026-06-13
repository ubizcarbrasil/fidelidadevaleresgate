import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LogIn } from "lucide-react";

/**
 * Dialog modal exibido quando a sessão do usuário expira involuntariamente
 * (refresh token falhou, token expirou). Substitui o redirect-silencioso
 * antigo que dropava o usuário em /auth sem aviso.
 *
 * Quando o usuário clica "Fazer login", navega pra /auth. A página /auth
 * (Auth.tsx) lê AUTH_RETURN_TO_KEY do sessionStorage e devolve o usuário
 * pra rota onde estava.
 */
export function SessionExpiredDialog() {
  const { sessionExpired, dismissSessionExpired } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    dismissSessionExpired();
    navigate("/auth", { replace: true });
  };

  return (
    <AlertDialog open={sessionExpired} onOpenChange={(open) => !open && dismissSessionExpired()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sessão expirada</AlertDialogTitle>
          <AlertDialogDescription>
            Sua sessão expirou por inatividade ou foi encerrada em outra aba.
            Faça login novamente para continuar de onde parou.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleLogin} className="gap-2">
            <LogIn className="h-4 w-4" />
            Fazer login
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
