import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Ticket, Store, Rocket } from "lucide-react";
import PlatformLogo from "@/components/PlatformLogo";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isForgot) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) toast.error(error.message);
      else toast.success("Email de recuperação enviado!");
      setLoading(false);
      return;
    }

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
      } else {
        // Check if user is a store owner (store_admin role) to redirect accordingly
        const userId = data.user?.id;
        if (userId) {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId);
          const isStoreAdmin = roles?.some(r => r.role === "store_admin");
          const hasAdminRole = roles?.some(r =>
            ["root_admin", "tenant_admin", "brand_admin", "branch_admin", "branch_operator", "operator_pdv"].includes(r.role)
          );
          if (isStoreAdmin && !hasAdminRole) {
            navigate("/store-panel");
          } else {
            navigate("/");
          }
        } else {
          navigate("/");
        }
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) toast.error(error.message);
      else {
        toast.success("Conta criada com sucesso!");
        navigate("/");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <img src="/logo-vale-resgate.jpeg" alt="Vale Resgate" className="mx-auto h-16 w-auto rounded-2xl shadow-md" />
          <CardTitle className="text-2xl font-bold">Vale Resgate</CardTitle>
          <CardDescription>
            {isForgot ? "Recuperar senha" : isLogin ? "Acesse sua conta" : "Crie sua conta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !isForgot && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {!isForgot && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Aguarde..." : isForgot ? "Enviar email" : isLogin ? "Entrar" : "Criar conta"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm space-y-1">
            {!isForgot && (
              <button type="button" onClick={() => setIsForgot(true)} className="text-primary hover:underline block mx-auto">
                Esqueceu a senha?
              </button>
            )}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setIsForgot(false); }}
              className="text-primary hover:underline block mx-auto"
            >
              {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
            </button>
            {isForgot && (
              <button type="button" onClick={() => setIsForgot(false)} className="text-muted-foreground hover:underline block mx-auto">
                Voltar ao login
              </button>
            )}
          </div>

          {/* Store owner CTA */}
          <div className="mt-6 pt-5 border-t space-y-3">
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-center space-y-2">
              <p className="text-xs font-medium text-primary">🚀 Quer ter sua própria plataforma?</p>
              <p className="text-[11px] text-muted-foreground">Crie seu programa de fidelidade e teste 30 dias grátis!</p>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="w-full gap-2"
                onClick={() => navigate("/trial")}
              >
                <Rocket className="h-4 w-4" />
                Começar 30 dias grátis
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">Tem um estabelecimento?</p>
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => navigate("/register-store")}
            >
              <Store className="h-4 w-4" />
              Quero ser parceiro
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
