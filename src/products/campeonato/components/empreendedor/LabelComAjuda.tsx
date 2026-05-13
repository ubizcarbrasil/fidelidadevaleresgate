import { HelpCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  htmlFor?: string;
  children: ReactNode;
  ajuda: string;
  className?: string;
}

/**
 * Label com ícone de ajuda contextual ao lado.
 * Usado nos editores de criação de temporada para deixar cada campo
 * autoexplicativo via tooltip.
 */
export default function LabelComAjuda({
  htmlFor,
  children,
  ajuda,
  className,
}: Props) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs">
        {children}
      </Label>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              tabIndex={-1}
              className="text-muted-foreground/70 transition-colors hover:text-foreground"
              aria-label="Ajuda"
            >
              <HelpCircle className="h-3 w-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[260px] text-xs leading-snug">
            {ajuda}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}