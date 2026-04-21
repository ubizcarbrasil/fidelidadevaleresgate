import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Lock, Send } from "lucide-react";
import { schemaAgendarDemo, type FormularioAgendarDemo } from "../schemas/schema_agendar_demo";
import {
  OPCOES_CARGO,
  OPCOES_FAIXA_MOTORISTAS,
  OPCOES_SOLUCAO_ATUAL,
  OPCOES_CANAL_CONTATO,
  OPCOES_JANELA,
} from "../constants/constantes_demo";

interface Props {
  primaryColor: string;
  enviando: boolean;
  onSubmit: (data: FormularioAgendarDemo) => void;
}

export default function FormularioAgendarDemo({ primaryColor, enviando, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormularioAgendarDemo>({
    resolver: zodResolver(schemaAgendarDemo),
    defaultValues: {
      preferred_contact: "whatsapp",
    },
  });

  const cargo = watch("company_role");
  const faixa = watch("company_size");
  const solucao = watch("current_solution");
  const canal = watch("preferred_contact");
  const janela = watch("preferred_window");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Seção 1: Sobre você */}
      <fieldset className="space-y-4">
        <legend className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: primaryColor }}>
          1. Sobre você
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">
              Nome completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="full_name"
              placeholder="Seu nome"
              {...register("full_name")}
              aria-invalid={!!errors.full_name}
            />
            {errors.full_name && (
              <p className="text-xs text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="work_email">
              E-mail corporativo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="work_email"
              type="email"
              placeholder="voce@empresa.com.br"
              {...register("work_email")}
              aria-invalid={!!errors.work_email}
            />
            {errors.work_email && (
              <p className="text-xs text-destructive">{errors.work_email.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone">
              WhatsApp / telefone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(11) 98765-4321"
              {...register("phone")}
              aria-invalid={!!errors.phone}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company_role">Cargo</Label>
            <Select
              value={cargo || ""}
              onValueChange={(v) => setValue("company_role", v)}
            >
              <SelectTrigger id="company_role">
                <SelectValue placeholder="Selecione seu cargo" />
              </SelectTrigger>
              <SelectContent>
                {OPCOES_CARGO.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </fieldset>

      {/* Seção 2: Sobre sua operação */}
      <fieldset className="space-y-4">
        <legend className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: primaryColor }}>
          2. Sobre sua operação
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="company_name">
              Nome da empresa <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company_name"
              placeholder="Nome da sua plataforma"
              {...register("company_name")}
              aria-invalid={!!errors.company_name}
            />
            {errors.company_name && (
              <p className="text-xs text-destructive">{errors.company_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="city">Cidade principal de operação</Label>
            <Input
              id="city"
              placeholder="Ex: São Paulo, Recife..."
              {...register("city")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="company_size">Faixa de motoristas</Label>
            <Select
              value={faixa || ""}
              onValueChange={(v) => setValue("company_size", v as FormularioAgendarDemo["company_size"])}
            >
              <SelectTrigger id="company_size">
                <SelectValue placeholder="Selecione a faixa" />
              </SelectTrigger>
              <SelectContent>
                {OPCOES_FAIXA_MOTORISTAS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="current_solution">Solução de engajamento atual</Label>
            <Select
              value={solucao || ""}
              onValueChange={(v) => setValue("current_solution", v as FormularioAgendarDemo["current_solution"])}
            >
              <SelectTrigger id="current_solution">
                <SelectValue placeholder="Como vocês fazem hoje?" />
              </SelectTrigger>
              <SelectContent>
                {OPCOES_SOLUCAO_ATUAL.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </fieldset>

      {/* Seção 3: Sobre a demo */}
      <fieldset className="space-y-4">
        <legend className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: primaryColor }}>
          3. Sobre a demonstração
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="preferred_contact">Canal preferido de contato</Label>
            <Select
              value={canal || "whatsapp"}
              onValueChange={(v) => setValue("preferred_contact", v as FormularioAgendarDemo["preferred_contact"])}
            >
              <SelectTrigger id="preferred_contact">
                <SelectValue placeholder="Como prefere ser contatado?" />
              </SelectTrigger>
              <SelectContent>
                {OPCOES_CANAL_CONTATO.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="preferred_window">Melhor janela do dia</Label>
            <Select
              value={janela || ""}
              onValueChange={(v) => setValue("preferred_window", v as FormularioAgendarDemo["preferred_window"])}
            >
              <SelectTrigger id="preferred_window">
                <SelectValue placeholder="Quando prefere falar?" />
              </SelectTrigger>
              <SelectContent>
                {OPCOES_JANELA.map((j) => (
                  <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="interest_message">O que você gostaria de ver na demo? (opcional)</Label>
          <Textarea
            id="interest_message"
            placeholder="Ex: queremos entender como reduzir cancelamento de corridas e aumentar engajamento dos motoristas mais ativos..."
            rows={4}
            {...register("interest_message")}
          />
          {errors.interest_message && (
            <p className="text-xs text-destructive">{errors.interest_message.message}</p>
          )}
        </div>
      </fieldset>

      <div className="space-y-3 border-t pt-6">
        <Button
          type="submit"
          size="lg"
          disabled={enviando}
          className="w-full gap-2 font-semibold text-base py-6 shadow-lg"
          style={{ backgroundColor: primaryColor, color: "#fff" }}
        >
          {enviando ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Agendar demonstração
            </>
          )}
        </Button>
        <p className="text-[11px] text-muted-foreground text-center inline-flex items-center gap-1.5 justify-center w-full">
          <Lock className="h-3 w-3" />
          Resposta em até 1 dia útil · Seus dados estão protegidos pela LGPD
        </p>
      </div>
    </form>
  );
}