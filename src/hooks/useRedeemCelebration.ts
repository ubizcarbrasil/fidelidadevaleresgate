import { useCallback } from "react";
import { toast } from "sonner";

interface CelebrationOptions {
  title?: string;
  description?: string;
}

/**
 * Hook que dispara feedback visual e háptico após resgate bem-sucedido.
 * - Toast motivacional com ícone de troféu
 * - Vibração leve (se disponível)
 */
export function useRedeemCelebration() {
  const celebrate = useCallback(
    (options?: CelebrationOptions) => {
      const {
        title = "Voucher resgatado! 🎉",
        description = "Aproveite seu benefício. Boa sorte!",
      } = options ?? {};

      toast.success(title, {
        description,
        duration: 4000,
        icon: "🏆",
      });

      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    },
    [],
  );

  return { celebrate };
}
