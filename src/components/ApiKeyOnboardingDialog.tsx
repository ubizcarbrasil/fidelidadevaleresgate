import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Key, User, Plug, ArrowRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ApiKeyOnboardingDialogProps {
  open: boolean;
  onDismiss: () => void;
  brandId: string;
}

const STEPS = [
  {
    icon: User,
    title: "Usuário e Senha da API",
    description: "Na aba Chaves API do seu painel, crie um novo par de credenciais. O sistema gerará automaticamente um login e senha para integração.",
    badge: "Passo 1",
  },
  {
    icon: Key,
    title: "Chave de API (API Key)",
    description: "Copie a chave API gerada. Essa chave será usada no cabeçalho x-api-key das requisições de pontuação automática via webhook.",
    badge: "Passo 2",
  },
  {
    icon: Plug,
    title: "Integração com seu sistema",
    description: "Configure seu sistema (PDV, ERP ou app) para enviar requisições POST ao endpoint de pontuação com a chave API. Consulte a documentação da API para detalhes.",
    badge: "Passo 3",
  },
];

export function ApiKeyOnboardingDialog({ open, onDismiss, brandId }: ApiKeyOnboardingDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleDismiss = async () => {
    // Persist flag so dialog doesn't show again
    try {
      const { data: brand } = await supabase.from("brands").select("brand_settings_json").eq("id", brandId).single();
      const settings = (brand?.brand_settings_json as Record<string, any>) || {};
      await supabase.from("brands").update({
        brand_settings_json: { ...settings, api_key_onboarding_seen: true },
      }).eq("id", brandId);
    } catch {
      // Silently fail — dialog won't reappear on next check
    }
    onDismiss();
  };

  const step = STEPS[currentStep];
  const StepIcon = step.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Configure sua API Key
          </DialogTitle>
          <DialogDescription>
            Para ativar a pontuação automática de clientes, siga os passos abaixo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full transition-colors ${i === currentStep ? "bg-primary" : i < currentStep ? "bg-primary/40" : "bg-muted"}`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="rounded-lg border p-5 space-y-3 text-center">
            <Badge variant="secondary" className="mb-2">{step.badge}</Badge>
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <StepIcon className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="font-semibold text-foreground">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            {currentStep < STEPS.length - 1 ? (
              <>
                <Button variant="ghost" className="flex-1" onClick={handleDismiss}>
                  <X className="h-4 w-4 mr-1" />
                  Pular
                </Button>
                <Button className="flex-1" onClick={() => setCurrentStep((s) => s + 1)}>
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </>
            ) : (
              <Button className="w-full" onClick={handleDismiss}>
                Entendi, vamos começar!
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
