import React, { useState } from "react";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, User } from "lucide-react";

function formatCpfInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

interface Props {
  logoUrl?: string;
  brandName: string;
  fontHeading?: string;
}

export default function DriverCpfLogin({ logoUrl, brandName, fontHeading }: Props) {
  const { loginByCpf } = useDriverSession();
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await loginByCpf(cpf);
    if (!result.success) {
      setError(result.error || "Erro ao acessar");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm space-y-8">
        {/* Brand logo */}
        <div className="flex flex-col items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={brandName} className="h-16 w-16 object-contain rounded-2xl" />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <h1
            className="text-xl font-extrabold text-foreground text-center"
            style={{ fontFamily: fontHeading || "inherit" }}
          >
            Acesse sua conta
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            Digite seu CPF para entrar no marketplace
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">CPF</label>
            <Input
              value={formatCpfInput(cpf)}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="000.000.000-00"
              inputMode="numeric"
              maxLength={14}
              className="h-12 text-base rounded-xl bg-muted border-border"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading || cpf.replace(/\D/g, "").length < 11}
            className="w-full h-12 rounded-xl text-base font-bold"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
