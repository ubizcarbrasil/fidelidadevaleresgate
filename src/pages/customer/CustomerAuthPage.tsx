import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, User, Phone, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { translateError } from "@/lib/translateError";

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

function withAlpha(hslColor: string, alpha: number): string {
  const inner = hslColor.match(/hsl\((.+)\)/)?.[1];
  if (!inner) return hslColor;
  return `hsl(${inner} / ${alpha})`;
}

type Mode = "login" | "register";

interface Props {
  onSkip?: () => void;
}

export default function CustomerAuthPage({ onSkip }: Props) {
  const { brand, theme } = useBrand();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const primary = hslToCss(theme?.colors?.secondary, "") || hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";
  const fontBody = theme?.font_body ? `"${theme.font_body}", sans-serif` : "inherit";
  const displayName = theme?.display_name || brand?.name || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name, phone },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: "Conta criada!",
          description: "Verifique seu email para confirmar o cadastro.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao autenticar";
      toast({
        title: "Erro",
        description: translateError(message),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 bg-background"
      style={{ color: fg, fontFamily: fontBody }}
    >
      <div
        className="w-full max-w-sm rounded-[24px] p-7 bg-card"
        style={{ boxShadow: "0 4px 24px hsl(var(--foreground) / 0.06)" }}
      >
        {/* Brand header */}
        <div className="text-center mb-7">
          {theme?.logo_url ? (
            <div className="h-14 w-14 mx-auto mb-4 rounded-2xl overflow-hidden" style={{ boxShadow: "0 2px 10px hsl(var(--foreground) / 0.08)" }}>
              <img src={theme.logo_url} alt={displayName} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div
              className="h-14 w-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-bold"
              style={{
                background: `linear-gradient(135deg, ${primary}, ${primary}bb)`,
                color: "#fff",
                boxShadow: `0 4px 16px -4px ${primary}50`,
              }}
            >
              {displayName.charAt(0)}
            </div>
          )}
          <h1 className="text-2xl font-bold" style={{ fontFamily: fontHeading }}>
            {mode === "login" ? "Bem-vindo!" : "Criar conta"}
          </h1>
          <p className="text-sm mt-1.5 text-muted-foreground">{displayName}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block text-muted-foreground">Nome</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    required
                    className="pl-10 h-12 rounded-xl border-0 bg-muted"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1.5 block text-muted-foreground">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-0000"
                    className="pl-10 h-12 rounded-xl border-0 bg-muted"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <Label className="text-xs font-semibold mb-1.5 block text-muted-foreground">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="pl-10 h-12 rounded-xl border-0 bg-muted"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold mb-1.5 block text-muted-foreground">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="pl-10 h-12 rounded-xl border-0 bg-muted"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-2xl font-bold text-base"
            style={{
              backgroundColor: primary,
              color: "#fff",
              boxShadow: `0 4px 16px -4px ${primary}50`,
            }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <div className="mt-5 text-center text-sm">
          {mode === "login" ? (
            <p className="text-muted-foreground">
              Não tem conta?{" "}
              <button onClick={() => setMode("register")} className="font-bold hover:underline" style={{ color: primary }}>
                Cadastre-se
              </button>
            </p>
          ) : (
            <p className="text-muted-foreground">
              Já tem conta?{" "}
              <button onClick={() => setMode("login")} className="font-bold hover:underline" style={{ color: primary }}>
                Entrar
              </button>
            </p>
          )}
        </div>

        {onSkip && (
          <button
            onClick={onSkip}
            className="mt-5 w-full text-center text-sm flex items-center justify-center gap-1.5 py-2 text-muted-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Continuar sem login
          </button>
        )}
      </div>
    </div>
  );
}
