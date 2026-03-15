import { Link } from "react-router-dom";
import PlatformLogo from "@/components/PlatformLogo";

export default function LandingFooter() {
  return (
    <footer className="border-t border-white/5 py-10 bg-[hsl(220,30%,5%)]">
      <div className="max-w-6xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40">
        <div className="flex items-center gap-3">
          <PlatformLogo className="h-7 w-7 rounded-md" />
          <p>© {new Date().getFullYear()} Vale Resgate. Todos os direitos reservados.</p>
        </div>
        <div className="flex gap-6">
          <Link to="/auth" className="hover:text-white transition-colors">Entrar</Link>
          <Link to="/trial" className="hover:text-white transition-colors">Criar conta</Link>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </div>
      </div>
    </footer>
  );
}
