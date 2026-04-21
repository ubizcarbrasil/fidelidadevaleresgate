import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PlatformLogo from "@/components/PlatformLogo";
import { ArrowLeft } from "lucide-react";

interface Props {
  voltarUrl: string;
}

export default function BlocoTopbarDemo({ voltarUrl }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <PlatformLogo className="h-8 w-8 rounded-lg flex-shrink-0" />
          <span className="text-sm font-bold truncate">Vale Resgate</span>
        </Link>
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to={voltarUrl}>
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Voltar à página do produto</span>
            <span className="sm:hidden">Voltar</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}