import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";
import type { DriverRow } from "@/pages/DriverManagementPage";

interface Props {
  driver: DriverRow;
}

export default function DriverPasswordReset({ driver }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!driver.email) {
      toast.error("Este motorista não tem e-mail vinculado.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(driver.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success(`E-mail de redefinição enviado para ${driver.email}`);
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar e-mail de redefinição");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} disabled={!driver.email}>
        <KeyRound className="h-3.5 w-3.5 mr-1" />
        Redefinir Senha
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              Será enviado um e-mail de redefinição de senha para <strong>{driver.email}</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleReset} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Enviar E-mail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
