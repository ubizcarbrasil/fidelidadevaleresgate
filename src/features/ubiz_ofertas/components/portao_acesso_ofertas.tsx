import { Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { ModoAcessoOfertas } from "./controle_acesso_ofertas";

interface Props {
  modo: ModoAcessoOfertas;
  whitelist: string[];
  fontHeading?: string;
  children: React.ReactNode;
}

const STORAGE_KEY = "ubiz_ofertas_access_token";

function normalizar(v: string): string {
  const t = v.trim().toLowerCase();
  if (!t) return "";
  if (/^[\d+()\-\s]+$/.test(t) && !t.includes("@")) return t.replace(/\D/g, "");
  return t;
}

export default function PortaoAcessoOfertas({ modo, whitelist, fontHeading, children }: Props) {
  // useAuth() lança erro se não houver AuthProvider. Na rota fast-track
  // /ofertas, o provider não é montado para acelerar a abertura, então
  // tratamos como visitante anônimo nesse caso.
  let user: { email?: string | null } | null = null;
  let loading = false;
  try {
    const ctx = useAuth();
    user = ctx.user;
    loading = ctx.loading;
  } catch {
    user = null;
    loading = false;
  }
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [liberadoLocal, setLiberadoLocal] = useState(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      return salvo && (whitelist || []).map(normalizar).includes(normalizar(salvo));
    } catch {
      return false;
    }
  });

  // Modo público: libera direto
  if (modo === "public") return <>{children}</>;

  // Modo autenticado
  if (modo === "authenticated") {
    if (loading) return null;
    if (!user) {
      const dest = encodeURIComponent(window.location.pathname + window.location.search);
      return (
        <TelaBloqueio
          icone={<Lock className="h-6 w-6" />}
          titulo="Login obrigatório"
          descricao="Esta vitrine está disponível apenas para usuários autenticados."
          fontHeading={fontHeading}
          acao={
            <Button onClick={() => (window.location.href = `/auth?redirect=${dest}`)}>
              Fazer login
            </Button>
          }
        />
      );
    }
    return <>{children}</>;
  }

  // Modo whitelist
  const lista = (whitelist || []).map(normalizar).filter(Boolean);
  const emailUsuario = user?.email ? normalizar(user.email) : "";
  const usuarioPermitido = emailUsuario && lista.includes(emailUsuario);

  if (usuarioPermitido || liberadoLocal) return <>{children}</>;

  const validar = () => {
    const n = normalizar(valor);
    if (!n) {
      setErro("Informe um e-mail ou telefone");
      return;
    }
    if (lista.includes(n)) {
      try {
        localStorage.setItem(STORAGE_KEY, n);
      } catch {}
      setLiberadoLocal(true);
      setErro(null);
    } else {
      setErro("Este contato não está autorizado a acessar a vitrine.");
    }
  };

  return (
    <TelaBloqueio
      icone={<ShieldCheck className="h-6 w-6" />}
      titulo="Acesso restrito"
      descricao="Esta vitrine está disponível apenas para contatos autorizados. Informe seu e-mail ou telefone cadastrado."
      fontHeading={fontHeading}
      acao={
        <div className="w-full space-y-2">
          <Label className="text-xs text-left block">E-mail ou telefone</Label>
          <div className="flex gap-2">
            <Input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && validar()}
              placeholder="seu@email.com"
              className="h-10"
              autoFocus
            />
            <Button onClick={validar}>Entrar</Button>
          </div>
          {erro && <p className="text-xs text-destructive text-left">{erro}</p>}
        </div>
      }
    />
  );
}

function TelaBloqueio({
  icone,
  titulo,
  descricao,
  acao,
  fontHeading,
}: {
  icone: React.ReactNode;
  titulo: string;
  descricao: string;
  acao: React.ReactNode;
  fontHeading?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
          {icone}
        </div>
        <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: fontHeading || "inherit" }}>
          {titulo}
        </h1>
        <p className="text-sm text-muted-foreground">{descricao}</p>
        <div className="pt-2">{acao}</div>
      </div>
    </div>
  );
}