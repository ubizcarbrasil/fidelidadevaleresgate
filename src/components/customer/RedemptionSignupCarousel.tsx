import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, User, Mail, Phone, KeyRound, Lock, CreditCard } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { translateError } from "@/lib/translateError";
import { brandAlpha } from "@/lib/utils";

interface SignupData {
  cpf: string;
  name: string;
  email: string;
  phone: string;
  otp: string;
  password: string;
}

interface Props {
  primary: string;
  fg: string;
  fontHeading: string;
  onComplete: (cpf: string) => void;
  onCancel: () => void;
  onSigningUp?: () => void;
}

const STEPS = ["CPF", "Nome", "E-mail", "Telefone", "Código", "Senha"] as const;

const formatCpf = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export default function RedemptionSignupCarousel({ primary, fg, fontHeading, onComplete, onCancel, onSigningUp }: Props) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SignupData>({ cpf: "", name: "", email: "", phone: "", otp: "", password: "" });

  const update = (field: keyof SignupData, value: string) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const goNext = () => { setDirection(1); setStep((s) => s + 1); };
  const goBack = () => { setDirection(-1); setStep((s) => s - 1); };

  const isValidCpf = data.cpf.replace(/\D/g, "").length === 11;
  const isValidName = data.name.trim().length >= 2;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
  const isValidPhone = data.phone.replace(/\D/g, "").length >= 10;
  const isValidOtp = data.otp.replace(/\D/g, "").length === 6;
  const isValidPassword = data.password.length >= 6;

  const canAdvance = [isValidCpf, isValidName, isValidEmail, isValidPhone, isValidOtp, isValidPassword][step];

  const handleSendOtp = async () => {
    toast({ title: "Código enviado!", description: "Use o código 123456" });
    goNext();
  };

  const handleVerifyOtp = async () => {
    const code = data.otp.replace(/\D/g, "");
    if (code !== "123456") {
      toast({ title: "Código inválido", description: "Use 123456", variant: "destructive" });
      return;
    }
    onSigningUp?.();
    goNext();
  };

  const handleSetPassword = async () => {
    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
            phone: data.phone.replace(/\D/g, ""),
            cpf: data.cpf.replace(/\D/g, ""),
          },
        },
      });

      if (signUpError?.message?.includes("already registered") || signUpError?.message?.includes("already exists")) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (signInError) throw signInError;
      } else if (signUpError) {
        throw signUpError;
      }

      let attempts = 0;
      while (attempts < 10) {
        const { data: sessionCheck } = await supabase.auth.getSession();
        if (sessionCheck.session?.access_token) break;
        await new Promise((r) => setTimeout(r, 500));
        attempts++;
      }

      toast({ title: "Conta criada!", description: "Finalizando seu resgate..." });
      setTimeout(() => onComplete(data.cpf), 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro inesperado";
      toast({ title: "Erro", description: translateError(message), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAdvance = () => {
    if (step === 3) return handleSendOtp();
    if (step === 4) return handleVerifyOtp();
    if (step === 5) return handleSetPassword();
    goNext();
  };

  const stepIcons = [CreditCard, User, Mail, Phone, KeyRound, Lock];
  const StepIcon = stepIcons[step];

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <div>
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 mb-5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === step ? 24 : 8,
              backgroundColor: i === step ? primary : i < step ? primary : brandAlpha(fg, 0.08),
              opacity: i < step ? 0.5 : 1,
            }}
          />
        ))}
      </div>

      {/* Step icon + label */}
      <div className="text-center mb-4">
        <div className="h-12 w-12 mx-auto mb-2 rounded-2xl flex items-center justify-center" style={{ backgroundColor: brandAlpha(primary, 0.07) }}>
          <StepIcon className="h-6 w-6" style={{ color: primary }} />
        </div>
        <h3 className="text-lg font-bold" style={{ fontFamily: fontHeading }}>{STEPS[step]}</h3>
        <p className="text-xs mt-0.5" style={{ color: brandAlpha(fg, 0.31) }}>
          {["Informe seu CPF", "Como podemos te chamar?", "Para verificação da conta", "Seu número de contato", "Digite o código enviado por e-mail", "Crie uma senha segura"][step]}
        </p>
      </div>

      {/* Carousel area */}
      <div className="relative overflow-hidden" style={{ minHeight: 72 }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {step === 0 && (
              <input
                type="text" inputMode="numeric" value={data.cpf}
                onChange={(e) => update("cpf", formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full text-center text-lg font-mono tracking-wider px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2"
                style={{ borderColor: brandAlpha(fg, 0.08), color: '#000', backgroundColor: '#fff' }}
                maxLength={14}
                autoFocus
              />
            )}
            {step === 1 && (
              <input
                type="text" value={data.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Nome completo"
                className="w-full text-center text-lg px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2"
                style={{ borderColor: brandAlpha(fg, 0.08), color: '#000', backgroundColor: '#fff' }}
                autoFocus
              />
            )}
            {step === 2 && (
              <input
                type="email" value={data.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="seu@email.com"
                className="w-full text-center text-lg px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2"
                style={{ borderColor: brandAlpha(fg, 0.08), color: '#000', backgroundColor: '#fff' }}
                autoFocus
              />
            )}
            {step === 3 && (
              <input
                type="tel" inputMode="numeric" value={data.phone}
                onChange={(e) => update("phone", formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                className="w-full text-center text-lg font-mono tracking-wider px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2"
                style={{ borderColor: brandAlpha(fg, 0.08), color: '#000', backgroundColor: '#fff' }}
                maxLength={15}
                autoFocus
              />
            )}
            {step === 4 && (
              <input
                type="text" inputMode="numeric" value={data.otp}
                onChange={(e) => update("otp", e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-3xl font-mono tracking-[0.4em] px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2"
                style={{ borderColor: brandAlpha(fg, 0.08), color: '#000', backgroundColor: '#fff' }}
                maxLength={6}
                autoFocus
              />
            )}
            {step === 5 && (
              <input
                type="password" value={data.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full text-center text-lg px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2"
                style={{ borderColor: brandAlpha(fg, 0.08), color: '#000', backgroundColor: '#fff' }}
                autoFocus
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-5">
        <button
          onClick={step === 0 ? onCancel : goBack}
          disabled={loading}
          className="flex-1 py-3.5 rounded-2xl font-semibold text-sm"
          style={{ backgroundColor: brandAlpha(fg, 0.03), color: brandAlpha(fg, 0.44) }}
        >
          {step === 0 ? "Cancelar" : "Voltar"}
        </button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleAdvance}
          disabled={!canAdvance || loading}
          className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: primary }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : step === 5 ? "Criar conta e resgatar" : "Próximo"}
        </motion.button>
      </div>
    </div>
  );
}
