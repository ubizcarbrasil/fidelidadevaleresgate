import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LeadComercialRow } from "@/features/agendar_demonstracao/types/tipos_lead";

interface BlocoInfoLeadProps {
  lead: LeadComercialRow;
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string | null | undefined }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-2 border-b border-border/50 last:border-0">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{rotulo}</span>
      <span className="text-sm break-words">{valor && valor.trim() !== "" ? valor : "—"}</span>
    </div>
  );
}

function formatarData(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BlocoInfoLead({ lead }: BlocoInfoLeadProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contato</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Linha rotulo="Nome" valor={lead.full_name} />
          <Linha rotulo="E-mail" valor={lead.work_email} />
          <Linha rotulo="Telefone" valor={lead.phone} />
          <Linha rotulo="Cargo" valor={lead.company_role} />
          <Linha rotulo="Canal preferido" valor={lead.preferred_contact} />
          <Linha rotulo="Janela preferida" valor={lead.preferred_window} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Empresa</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Linha rotulo="Razão / Nome" valor={lead.company_name} />
          <Linha rotulo="Cidade" valor={lead.city} />
          <Linha rotulo="Faixa motoristas" valor={lead.company_size} />
          <Linha rotulo="Solução atual" valor={lead.current_solution} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Produto de interesse</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Linha rotulo="Produto" valor={lead.product_name} />
          <Linha rotulo="Slug" valor={lead.product_slug} />
          <Linha rotulo="Mensagem" valor={lead.interest_message} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Origem & rastreio</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Linha rotulo="Source" valor={lead.source} />
          <Linha rotulo="UTM source" valor={lead.utm_source} />
          <Linha rotulo="UTM medium" valor={lead.utm_medium} />
          <Linha rotulo="UTM campaign" valor={lead.utm_campaign} />
          <Linha rotulo="Recebido em" valor={formatarData(lead.created_at)} />
          <Linha rotulo="Contatado em" valor={formatarData(lead.contacted_at)} />
          <Linha rotulo="Qualificado em" valor={formatarData(lead.qualified_at)} />
          <Linha rotulo="Convertido em" valor={formatarData(lead.converted_at)} />
        </CardContent>
      </Card>
    </div>
  );
}