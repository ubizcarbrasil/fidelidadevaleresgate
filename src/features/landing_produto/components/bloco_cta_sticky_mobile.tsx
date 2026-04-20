import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";

interface Props {
  trialDays: number;
  primaryColor: string;
  onCta: () => void;
}

export default function BlocoCtaStickyMobile({ trialDays, primaryColor, onCta }: Props) {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-background/95 backdrop-blur border-t shadow-2xl">
      <Button
        size="lg"
        className="w-full gap-2 font-semibold py-6 shadow-lg"
        style={{ backgroundColor: primaryColor, color: "#fff" }}
        onClick={onCta}
      >
        <Rocket className="h-5 w-5" />
        Começar trial de {trialDays} dias
      </Button>
    </div>
  );
}