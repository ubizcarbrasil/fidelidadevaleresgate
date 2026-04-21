import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Pencil } from "lucide-react";
import { sanitizeText, sanitizeEmail, sanitizePhone } from "@/lib/sanitize";
import {
  OPCOES_CARGO,
  OPCOES_FAIXA_MOTORISTAS,
  OPCOES_SOLUCAO_ATUAL,
  OPCOES_CANAL_CONTATO,
  OPCOES_JANELA,
} from "@/features/agendar_demonstracao/constants/constantes_demo";
import {
  schemaEdicaoLead,
  type DadosEdicaoLead,
} from "../schemas/schema_edicao_lead";
import { useAtualizarCamposLead } from "../hooks/hook_detalhes_lead";
import type { LeadComercialRow } from "@/features/agendar_demonstracao/types/tipos_lead";

interface DialogoEditarLeadProps {
  lead: LeadComercialRow;
}

function valoresIniciais(lead: LeadComercialRow): DadosEdicaoLead {
  return {
    full_name: lead.full_name ?? "",
    work_email: lead.work_email ?? "",
    phone: lead.phone ?? "",
    company_name: lead.company_name ?? "",
    company_role: lead.company_role ?? "",
    company_size: lead.company_size ?? "",
    city: lead.city ?? "",
    current_solution: lead.current_solution ?? "",
    interest_message: lead.interest_message ?? "",
    preferred_contact: lead.preferred_contact ?? "",
    preferred_window: lead.preferred_window ?? "",
    product_name: lead.product_name ?? "",
    product_slug: lead.product_slug ?? "",
    source: lead.source ?? "",
    utm_source: lead.utm_source ?? "",
    utm_medium: lead.utm_medium ?? "",
    utm_campaign: lead.utm_campaign ?? "",
  };
}

export default function DialogoEditarLead({ lead }: DialogoEditarLeadProps) {
  const [aberto, setAberto] = useState(false);
  const mutation = useAtualizarCamposLead(lead.id);

  const form = useForm<DadosEdicaoLead>({
    resolver: zodResolver(schemaEdicaoLead),
    defaultValues: valoresIniciais(lead),
  });

  useEffect(() => {
    if (aberto) form.reset(valoresIniciais(lead));
  }, [aberto, lead, form]);

  const onSubmit = form.handleSubmit((valores) => {
    const payload = {
      full_name: sanitizeText(valores.full_name, 150),
      work_email: sanitizeEmail(valores.work_email),
      phone: sanitizePhone(valores.phone),
      company_name: sanitizeText(valores.company_name, 150),
      company_role: valores.company_role ? sanitizeText(valores.company_role, 100) : null,
      company_size: valores.company_size || null,
      city: valores.city ? sanitizeText(valores.city, 100) : null,
      current_solution: valores.current_solution || null,
      interest_message: valores.interest_message
        ? sanitizeText(valores.interest_message, 2000)
        : null,
      preferred_contact: valores.preferred_contact || null,
      preferred_window: valores.preferred_window || null,
      product_name: valores.product_name ? sanitizeText(valores.product_name, 150) : null,
      product_slug: valores.product_slug ? sanitizeText(valores.product_slug, 150) : null,
      source: valores.source ? sanitizeText(valores.source, 100) : null,
      utm_source: valores.utm_source ? sanitizeText(valores.utm_source, 100) : null,
      utm_medium: valores.utm_medium ? sanitizeText(valores.utm_medium, 100) : null,
      utm_campaign: valores.utm_campaign ? sanitizeText(valores.utm_campaign, 100) : null,
    };
    mutation.mutate(payload, {
      onSuccess: () => setAberto(false),
    });
  });

  const errors = form.formState.errors;

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <Button variant="outline" size="sm" onClick={() => setAberto(true)}>
        <Pencil className="h-4 w-4 mr-2" />
        Editar
      </Button>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar lead</DialogTitle>
          <DialogDescription>
            Atualize os dados do lead. As mudanças são salvas no banco imediatamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <Tabs defaultValue="contato" className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="contato">Contato</TabsTrigger>
              <TabsTrigger value="empresa">Empresa</TabsTrigger>
              <TabsTrigger value="produto">Produto</TabsTrigger>
              <TabsTrigger value="origem">Origem</TabsTrigger>
            </TabsList>

            <TabsContent value="contato" className="space-y-3 pt-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="full_name">Nome completo</Label>
                  <Input id="full_name" {...form.register("full_name")} />
                  {errors.full_name && (
                    <p className="text-xs text-destructive">{errors.full_name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="work_email">E-mail</Label>
                  <Input id="work_email" type="email" {...form.register("work_email")} />
                  {errors.work_email && (
                    <p className="text-xs text-destructive">{errors.work_email.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" {...form.register("phone")} />
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company_role">Cargo</Label>
                  <Select
                    value={form.watch("company_role") || ""}
                    onValueChange={(v) => form.setValue("company_role", v)}
                  >
                    <SelectTrigger id="company_role">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPCOES_CARGO.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="preferred_contact">Canal preferido</Label>
                  <Select
                    value={form.watch("preferred_contact") || ""}
                    onValueChange={(v) => form.setValue("preferred_contact", v)}
                  >
                    <SelectTrigger id="preferred_contact">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPCOES_CANAL_CONTATO.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="preferred_window">Janela preferida</Label>
                  <Select
                    value={form.watch("preferred_window") || ""}
                    onValueChange={(v) => form.setValue("preferred_window", v)}
                  >
                    <SelectTrigger id="preferred_window">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPCOES_JANELA.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="empresa" className="space-y-3 pt-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="company_name">Razão / Nome</Label>
                  <Input id="company_name" {...form.register("company_name")} />
                  {errors.company_name && (
                    <p className="text-xs text-destructive">{errors.company_name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" {...form.register("city")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company_size">Faixa de motoristas</Label>
                  <Select
                    value={form.watch("company_size") || ""}
                    onValueChange={(v) => form.setValue("company_size", v)}
                  >
                    <SelectTrigger id="company_size">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPCOES_FAIXA_MOTORISTAS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="current_solution">Solução atual</Label>
                  <Select
                    value={form.watch("current_solution") || ""}
                    onValueChange={(v) => form.setValue("current_solution", v)}
                  >
                    <SelectTrigger id="current_solution">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPCOES_SOLUCAO_ATUAL.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="produto" className="space-y-3 pt-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="product_name">Produto</Label>
                  <Input id="product_name" {...form.register("product_name")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="product_slug">Slug do produto</Label>
                  <Input id="product_slug" {...form.register("product_slug")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="interest_message">Mensagem de interesse</Label>
                <Textarea
                  id="interest_message"
                  rows={4}
                  {...form.register("interest_message")}
                />
              </div>
            </TabsContent>

            <TabsContent value="origem" className="space-y-3 pt-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="source">Source</Label>
                  <Input id="source" {...form.register("source")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="utm_source">UTM source</Label>
                  <Input id="utm_source" {...form.register("utm_source")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="utm_medium">UTM medium</Label>
                  <Input id="utm_medium" {...form.register("utm_medium")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="utm_campaign">UTM campaign</Label>
                  <Input id="utm_campaign" {...form.register("utm_campaign")} />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setAberto(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}