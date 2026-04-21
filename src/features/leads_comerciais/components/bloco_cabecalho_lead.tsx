import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { STATUS_LABELS } from "@/features/agendar_demonstracao/constants/constantes_demo";
import type {
  LeadComercialRow,
  StatusLead,
} from "@/features/agendar_demonstracao/types/tipos_lead";
import DialogoEditarLead from "./dialogo_editar_lead";

interface BlocoCabecalhoLeadProps {
  lead: LeadComercialRow;
}

function abrirWhatsapp(telefone: string, nome: string) {
  const numeros = telefone.replace(/\D/g, "");
  const mensagem = encodeURIComponent(
    `Olá ${nome.split(" ")[0]}, recebemos seu interesse em conhecer nossa plataforma. Quando podemos conversar?`,
  );
  window.open(`https://wa.me/55${numeros}?text=${mensagem}`, "_blank");
}

export default function BlocoCabecalhoLead({ lead }: BlocoCabecalhoLeadProps) {
  const navigate = useNavigate();
  const statusInfo = STATUS_LABELS[lead.status as StatusLead] ?? STATUS_LABELS.novo;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/leads-comerciais")} className="-ml-2">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Voltar para leads
      </Button>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight truncate">{lead.full_name}</h1>
            <Badge variant="outline" className={statusInfo.color}>
              {statusInfo.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {lead.company_name}
            {lead.company_role ? ` · ${lead.company_role}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <DialogoEditarLead lead={lead} />
          <Button size="sm" variant="outline" onClick={() => abrirWhatsapp(lead.phone, lead.full_name)}>
            <MessageSquare className="h-4 w-4 mr-1" />
            WhatsApp
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.open(`mailto:${lead.work_email}`)}>
            <Mail className="h-4 w-4 mr-1" />
            E-mail
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.open(`tel:${lead.phone}`)}>
            <Phone className="h-4 w-4 mr-1" />
            Ligar
          </Button>
        </div>
      </div>
    </div>
  );
}