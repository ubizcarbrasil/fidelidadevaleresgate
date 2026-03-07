import { Link } from "react-router-dom";

export default function LandingFooter() {
  return (
    <footer className="border-t border-border py-10">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <img src="/logo-vale-resgate.jpeg" alt="Vale Resgate" className="h-7 w-auto rounded-md" />
          <p>© {new Date().getFullYear()} Vale Resgate. Todos os direitos reservados.</p>
        </div>
        <div className="flex gap-6">
          <Link to="/auth" className="hover:text-foreground transition-colors">Entrar</Link>
          <Link to="/trial" className="hover:text-foreground transition-colors">Criar conta</Link>
        </div>
      </div>
    </footer>
  );
}
