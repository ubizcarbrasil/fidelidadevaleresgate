import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
import {
  OPCOES_FAIXA_MOTORISTAS,
  STATUS_LABELS,
} from "@/features/agendar_demonstracao/constants/constantes_demo";
import type { FiltrosLeadsComerciais } from "../services/servico_leads_comerciais";

interface BlocoFiltrosLeadsProps {
  filtros: FiltrosLeadsComerciais;
  onChange: (f: FiltrosLeadsComerciais) => void;
  produtosDisponiveis: Array<{ slug: string; nome: string }>;
}

const VALOR_TODOS = "__todos__";

export default function BlocoFiltrosLeads({
  filtros,
  onChange,
  produtosDisponiveis,
}: BlocoFiltrosLeadsProps) {
  const limpar = () => onChange({});
  const temFiltros =
    !!filtros.busca ||
    !!filtros.productSlug ||
    !!filtros.status ||
    !!filtros.cidade ||
    !!filtros.faixaMotoristas ||
    !!filtros.periodoDe ||
    !!filtros.periodoAte;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Buscar</Label>
            <Input
              placeholder="Nome, e-mail, empresa…"
              value={filtros.busca ?? ""}
              onChange={(e) => onChange({ ...filtros, busca: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Produto</Label>
            <Select
              value={filtros.productSlug ?? VALOR_TODOS}
              onValueChange={(v) =>
                onChange({ ...filtros, productSlug: v === VALOR_TODOS ? null : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os produtos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={VALOR_TODOS}>Todos os produtos</SelectItem>
                {produtosDisponiveis.map((p) => (
                  <SelectItem key={p.slug} value={p.slug}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select
              value={filtros.status ?? VALOR_TODOS}
              onValueChange={(v) =>
                onChange({
                  ...filtros,
                  status: v === VALOR_TODOS ? null : (v as FiltrosLeadsComerciais["status"]),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={VALOR_TODOS}>Todos os status</SelectItem>
                {Object.entries(STATUS_LABELS).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    {info.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Faixa de motoristas</Label>
            <Select
              value={filtros.faixaMotoristas ?? VALOR_TODOS}
              onValueChange={(v) =>
                onChange({ ...filtros, faixaMotoristas: v === VALOR_TODOS ? null : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as faixas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={VALOR_TODOS}>Todas as faixas</SelectItem>
                {OPCOES_FAIXA_MOTORISTAS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Cidade</Label>
            <Input
              placeholder="Ex: São Paulo"
              value={filtros.cidade ?? ""}
              onChange={(e) => onChange({ ...filtros, cidade: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Período: de</Label>
            <Input
              type="date"
              value={filtros.periodoDe ?? ""}
              onChange={(e) => onChange({ ...filtros, periodoDe: e.target.value || null })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Período: até</Label>
            <Input
              type="date"
              value={filtros.periodoAte ?? ""}
              onChange={(e) => onChange({ ...filtros, periodoAte: e.target.value || null })}
            />
          </div>
          <div className="flex items-end">
            {temFiltros && (
              <Button variant="outline" onClick={limpar} className="w-full gap-2">
                <X className="h-4 w-4" />
                Limpar filtros
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
