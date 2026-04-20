import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function BlocoFooter() {
  return (
    <footer className="border-t bg-card mt-8">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>© {new Date().getFullYear()} Vale Resgate</span>
        <Link
          to="/produtos"
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
        >
          Ver outros produtos <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </footer>
  );
}