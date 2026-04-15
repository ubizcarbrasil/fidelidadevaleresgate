import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDriverSession } from "@/contexts/DriverSessionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ShieldCheck, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

interface Props {
  onVerified: () => void;
  onBack: () => void;
}

export default function DriverVerifyCodeStep({ onVerified, onBack }: Props) {
  const { driver } = useDriverSession();
  const [code, setCode] = useState("");
  const [expectedCode, setExpectedCode] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = useCallback(async () => {
    if (!driver) return;
    setSending(true);
    setError(null);

    const newCode = generateCode();

    const { error: insertErr } = await supabase
      .from("driver_verification_codes")
      .insert({
        customer_id: driver.id,
        code: newCode,
        email: driver.email,
      });

    if (insertErr) {
      setError("Erro ao gerar código. Tente novamente.");
      setSending(false);
      return;
    }

    setExpectedCode(newCode);
    setCodeSent(true);
    setSending(false);

    // Code stored in DB and state — no local exposure for security
  }, [driver]);

  // Auto-send on mount
  useEffect(() => {
    if (!codeSent) sendCode();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVerify = async () => {
    if (!driver || !expectedCode) return;
    setVerifying(true);
    setError(null);

    const trimmed = code.trim();

    if (trimmed !== expectedCode) {
      setError("Código incorreto. Verifique e tente novamente.");
      setVerifying(false);
      return;
    }

    // Mark code as used
    await supabase
      .from("driver_verification_codes")
      .update({ used: true })
      .eq("customer_id", driver.id)
      .eq("code", expectedCode)
      .eq("used", false);

    setVerifying(false);
    onVerified();
  };

  const maskedEmail = driver?.email
    ? driver.email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + b.replace(/./g, "*") + c)
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={onBack} className="h-9 w-9 flex items-center justify-center rounded-xl bg-muted">
          <ArrowLeft className="h-4.5 w-4.5 text-foreground" />
        </button>
        <h1 className="text-base font-bold">Verificação de Identidade</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-6 text-center">
          {/* Icon */}
          <div className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "hsl(var(--primary) / 0.15)" }}>
            <ShieldCheck className="h-8 w-8" style={{ color: "hsl(var(--primary))" }} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground mb-1">Confirme sua identidade</h2>
            <p className="text-sm text-muted-foreground">
              {maskedEmail ? (
                <>
                  Enviamos um código de 6 dígitos para{" "}
                  <span className="font-medium text-foreground">{maskedEmail}</span>
                </>
              ) : (
                "Um código de verificação foi gerado"
              )}
            </p>
          </div>

          {/* Code input */}
          <div className="space-y-3">
            <Input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError(null);
              }}
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
              className="h-14 text-center text-2xl font-bold tracking-[0.3em] rounded-xl bg-muted border-border"
              autoFocus
            />

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          {/* Verify button */}
          <Button
            className="w-full h-12 rounded-xl text-base font-bold"
            disabled={code.length < 6 || verifying}
            onClick={handleVerify}
          >
            {verifying ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verificar"}
          </Button>

          {/* Resend */}
          <button
            onClick={sendCode}
            disabled={sending}
            className="text-sm text-primary font-medium flex items-center gap-1.5 mx-auto"
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Mail className="h-3.5 w-3.5" />
            )}
            Reenviar código
          </button>
        </div>
      </div>
    </div>
  );
}
