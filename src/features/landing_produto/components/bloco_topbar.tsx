import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PlatformLogo from "@/components/PlatformLogo";
import { Rocket } from "lucide-react";

interface Props {
  trialUrl: string;
  primaryColor: string;
  ctaLabel?: string;
}

export default function BlocoTopbar({ trialUrl, primaryColor, ctaLabel }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <PlatformLogo className="h-8 w-8 rounded-lg flex-shrink-0" />
          <span className="text-sm font-bold truncate">Vale Resgate</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/auth">Já tenho conta</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="gap-1.5 font-semibold"
            style={{ backgroundColor: primaryColor, color: "#fff" }}
          >
            <Link to={trialUrl}>
              <Rocket className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">{ctaLabel || "Trial grátis"}</span>
              <span className="xs:hidden">Trial</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}