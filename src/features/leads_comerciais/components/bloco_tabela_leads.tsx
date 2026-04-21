import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ExternalLink, MessageSquare } from "lucide-react";
import { STATUS_LABELS } from "@/features/agendar_demonstracao/constants/constantes_demo";
import type {
  LeadComercialRow,
  StatusLead,
} from "@/features/agendar_demonstracao/types/tipos_lead";

interface BlocoTabelaLeadsProps {
  leads: LeadComercialRow[];
  isLoading: boolean;
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function abrirWhatsapp(telefone: string, nome: string) {
  const numeros = telefone.replace(/\D/g, "");
  const mensagem = encodeURIComponent(
    `Olá ${nome.split(" ")[0]}, recebemos seu interesse em conhecer nossa plataforma. Quando podemos conversar?`
  );
  window.open(`https://wa.me/55${numeros}?text=${mensagem}`, "_blank");
}

export default function BlocoTabelaLeads({ leads, isLoading }: BlocoTabelaLeadsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-16 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (leads.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center space-y-2">
          <p className="font-medium">Nenhum lead encontrado</p>
          <p className="text-sm text-muted-foreground">
            Ajuste os filtros ou aguarde novas solicitações de demonstração.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead className="hidden md:table-cell">Produto</TableHead>
              <TableHead className="hidden lg:table-cell">Cidade</TableHead>
              <TableHead className="hidden lg:table-cell">Faixa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Recebido</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => {
              const statusInfo = STATUS_LABELS[lead.status as StatusLead] ?? STATUS_LABELS.novo;
              return (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-medium truncate">{lead.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {lead.work_email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-medium truncate">{lead.company_name}</p>
                      {lead.company_role && (
                        <p className="text-xs text-muted-foreground truncate">
                          {lead.company_role}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm">{lead.product_name ?? lead.product_slug ?? "—"}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm">{lead.city ?? "—"}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm">{lead.company_size ?? "—"}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusInfo.color}>
                      {statusInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {formatarData(lead.created_at)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title="Abrir WhatsApp"
                        onClick={() => abrirWhatsapp(lead.phone, lead.full_name)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title="Enviar e-mail"
                        onClick={() => window.open(`mailto:${lead.work_email}`, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
