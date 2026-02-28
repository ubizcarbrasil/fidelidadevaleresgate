import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, User, Phone, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
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

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const bg = hslToCss(theme?.colors?.background, "hsl(var(--background))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const cardBg = hslToCss(theme?.colors?.card, "hsl(var(--card))");
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
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro ao autenticar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: bg, color: fg, fontFamily: fontBody }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-6 shadow-lg"
        style={{ backgroundColor: cardBg, borderColor: `${fg}15` }}
      >
        {/* Brand header */}
        <div className="text-center mb-6">
          {theme?.logo_url ? (
            <img src={theme.logo_url} alt={displayName} className="h-12 mx-auto mb-3 object-contain" />
          ) : (
            <div
              className="h-12 w-12 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-bold"
              style={{ backgroundColor: primary, color: "#fff" }}
            >
              {displayName.charAt(0)}
            </div>
          )}
          <h1 className="text-xl font-bold" style={{ fontFamily: fontHeading }}>
            {mode === "login" ? "Entrar" : "Criar conta"}
          </h1>
          <p className="text-sm opacity-60 mt-1">{displayName}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <div>
                <Label className="text-sm mb-1 block opacity-70">Nome</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    required
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm mb-1 block opacity-70">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-0000"
                    className="pl-10"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <Label className="text-sm mb-1 block opacity-70">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm mb-1 block opacity-70">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="pl-10"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl font-semibold text-base"
            style={{ backgroundColor: primary, color: "#fff" }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          {mode === "login" ? (
            <p>
              Não tem conta?{" "}
              <button onClick={() => setMode("register")} className="font-semibold hover:underline" style={{ color: primary }}>
                Cadastre-se
              </button>
            </p>
          ) : (
            <p>
              Já tem conta?{" "}
              <button onClick={() => setMode("login")} className="font-semibold hover:underline" style={{ color: primary }}>
                Entrar
              </button>
            </p>
          )}
        </div>

        {onSkip && (
          <button
            onClick={onSkip}
            className="mt-4 w-full text-center text-sm opacity-50 hover:opacity-80 flex items-center justify-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Continuar sem login
          </button>
        )}
      </div>
    </div>
  );
}
