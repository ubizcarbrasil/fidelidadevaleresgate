import { useState } from "react";
import { brandAlpha } from "@/lib/utils";
import { RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CancelRedemptionButtonProps {
  redemptionId: string;
  token: string;
  onCanceled: () => void;
  fg: string;
}

export function CancelRedemptionButton({ redemptionId, token, onCanceled, fg }: CancelRedemptionButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (pinInput !== token) {
      toast.error("PIN incorreto. Verifique e tente novamente.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("redemptions")
        .update({ status: "CANCELED" as "CANCELED" | "EXPIRED" | "PENDING" | "USED" })
        .eq("id", redemptionId)
        .eq("status", "PENDING");
      if (error) throw error;
      toast.success("Resgate estornado com sucesso!");
      onCanceled();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Tente novamente";
      toast.error("Erro ao estornar: " + message);
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-semibold border transition-transform active:scale-[0.98]"
        style={{ borderColor: "#DC2626", color: "#DC2626", backgroundColor: "#FEF2F2" }}
      >
        <RotateCcw className="h-4 w-4" />
        ESTORNAR RESGATE
      </button>
    );
  }

  return (
    <div className="rounded-2xl p-3 space-y-2" style={{ border: "1.5px solid #DC2626", backgroundColor: "#FEF2F2" }}>
      <p className="text-xs font-semibold text-center" style={{ color: "#991B1B" }}>
        Digite o PIN para confirmar o estorno
      </p>
      <input
        type="text"
        maxLength={6}
        value={pinInput}
        onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
        placeholder="000000"
        className="w-full text-center text-xl font-mono font-bold tracking-[0.3em] py-2 rounded-xl border outline-none"
        style={{ borderColor: "#DC262640", color: "#991B1B" }}
      />
      <div className="flex gap-2">
        <button
          onClick={() => { setConfirming(false); setPinInput(""); }}
          className="flex-1 py-2 rounded-xl text-xs font-semibold"
           style={{ backgroundColor: brandAlpha(fg, 0.06), color: brandAlpha(fg, 0.44) }}
        >
          Cancelar
        </button>
        <LoadingButton
          onClick={handleCancel}
          isLoading={loading}
          loadingText="Estornando..."
          disabled={pinInput.length < 6}
          className="flex-1 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50 h-auto"
          style={{ backgroundColor: "#DC2626" }}
        >
          Confirmar
        </LoadingButton>
      </div>
    </div>
  );
}
