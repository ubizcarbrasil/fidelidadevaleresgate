import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";
import { toast } from "sonner";

interface DialogCriarFranqueadoProps {
  open: boolean;
  onClose: () => void;
  brandId: string;
  branchId: string;
  branchName: string;
}

export default function DialogCriarFranqueado({
  open,
  onClose,
  brandId,
  branchId,
  branchName,
}: DialogCriarFranqueadoProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error("Informe o email");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-branch-admin", {
        body: {
          email: email.trim(),
          password,
          full_name: fullName.trim() || "Franqueado",
          brand_id: brandId,
          branch_id: branchId,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Franqueado criado com sucesso para ${branchName}`);
      setEmail("");
      setPassword("");
      setFullName("");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar franqueado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Franqueado</DialogTitle>
          <DialogDescription>
            Novo administrador para <strong>{branchName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="franq-name">Nome completo (opcional)</Label>
            <Input
              id="franq-name"
              placeholder="Nome do franqueado"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="franq-email">Email *</Label>
            <Input
              id="franq-email"
              type="email"
              placeholder="email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="franq-password">Senha *</Label>
            <Input
              id="franq-password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <LoadingButton
            className="w-full"
            isLoading={isLoading}
            loadingText="Criando..."
            onClick={handleSubmit}
          >
            Criar Franqueado
          </LoadingButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
