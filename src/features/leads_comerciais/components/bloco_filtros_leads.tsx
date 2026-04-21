import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
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

function paraIso(date: Date | undefined): string | null {
  if (!date) return null;
  return format(date, "yyyy-MM-dd");
}

function deIso(iso: string | null | undefined): Date | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

export default function BlocoFiltrosLeads({
  filtros,
  onChange,
  produtosDisponiveis,
}: BlocoFiltrosLeadsProps) {
  const [avancadoAberto, setAvancadoAberto] = useState(false);
  const limpar = () => onChange({});

  const filtrosAtivos = useMemo(() => {
    const ativos: { chave: keyof FiltrosLeadsComerciais; label: string }[] = [];
    if (filtros.busca) ativos.push({ chave: "busca", label: `Busca: ${filtros.busca}` });
    if (filtros.empresa) ativos.push({ chave: "empresa", label: `Empresa: ${filtros.empresa}` });
    if (filtros.productSlug) {
      const nome = produtosDisponiveis.find((p) => p.slug === filtros.productSlug)?.nome;
      ativos.push({ chave: "productSlug", label: `Produto: ${nome ?? filtros.productSlug}` });
    }
    if (filtros.produtoTexto)
      ativos.push({ chave: "produtoTexto", label: `Produto (texto): ${filtros.produtoTexto}` });
    if (filtros.status) ativos.push({ chave: "status", label: `Status: ${STATUS_LABELS[filtros.status]?.label ?? filtros.status}` });
    if (filtros.cidade) ativos.push({ chave: "cidade", label: `Cidade: ${filtros.cidade}` });
    if (filtros.faixaMotoristas)
      ativos.push({ chave: "faixaMotoristas", label: `Faixa: ${filtros.faixaMotoristas}` });
    if (filtros.source) ativos.push({ chave: "source", label: `Origem: ${filtros.source}` });
    if (filtros.utmSource) ativos.push({ chave: "utmSource", label: `UTM source: ${filtros.utmSource}` });
    if (filtros.utmMedium) ativos.push({ chave: "utmMedium", label: `UTM medium: ${filtros.utmMedium}` });
    if (filtros.utmCampaign) ativos.push({ chave: "utmCampaign", label: `UTM campaign: ${filtros.utmCampaign}` });
    if (filtros.periodoDe) ativos.push({ chave: "periodoDe", label: `De: ${filtros.periodoDe}` });
    if (filtros.periodoAte) ativos.push({ chave: "periodoAte", label: `Até: ${filtros.periodoAte}` });
    return ativos;
  }, [filtros, produtosDisponiveis]);

  const temFiltros = filtrosAtivos.length > 0;

  const removerFiltro = (chave: keyof FiltrosLeadsComerciais) => {
    const novo = { ...filtros };
    delete novo[chave];
    onChange(novo);
  };

  const dataDe = deIso(filtros.periodoDe);
  const dataAte = deIso(filtros.periodoAte);

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Linha principal: busca rápida + status + ações */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 space-y-1.5">
            <Label className="text-xs">Busca rápida</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nome, e-mail, empresa, telefone…"
                value={filtros.busca ?? ""}
                onChange={(e) => onChange({ ...filtros, busca: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>
          <div className="md:col-span-3 space-y-1.5">
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
          <div className="md:col-span-3 space-y-1.5">
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
        </div>

        {/* Busca avançada colapsável */}
        <Collapsible open={avancadoAberto} onOpenChange={setAvancadoAberto}>
          <div className="flex items-center justify-between gap-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 -ml-2">
                <SlidersHorizontal className="h-4 w-4" />
                Busca avançada
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    avancadoAberto && "rotate-180"
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            {temFiltros && (
              <Button variant="ghost" size="sm" onClick={limpar} className="gap-2 text-muted-foreground">
                <X className="h-4 w-4" />
                Limpar tudo
              </Button>
            )}
          </div>

          <CollapsibleContent className="pt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Empresa</Label>
                <Input
                  placeholder="Nome da empresa"
                  value={filtros.empresa ?? ""}
                  onChange={(e) => onChange({ ...filtros, empresa: e.target.value || null })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Produto (texto livre)</Label>
                <Input
                  placeholder="Nome ou slug do produto"
                  value={filtros.produtoTexto ?? ""}
                  onChange={(e) => onChange({ ...filtros, produtoTexto: e.target.value || null })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cidade</Label>
                <Input
                  placeholder="Ex: São Paulo"
                  value={filtros.cidade ?? ""}
                  onChange={(e) => onChange({ ...filtros, cidade: e.target.value || null })}
                />
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
                <Label className="text-xs">Origem (source)</Label>
                <Input
                  placeholder="ex: landing-page"
                  value={filtros.source ?? ""}
                  onChange={(e) => onChange({ ...filtros, source: e.target.value || null })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">UTM source</Label>
                <Input
                  placeholder="google, facebook…"
                  value={filtros.utmSource ?? ""}
                  onChange={(e) => onChange({ ...filtros, utmSource: e.target.value || null })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">UTM medium</Label>
                <Input
                  placeholder="cpc, organic…"
                  value={filtros.utmMedium ?? ""}
                  onChange={(e) => onChange({ ...filtros, utmMedium: e.target.value || null })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">UTM campaign</Label>
                <Input
                  placeholder="black-friday-2025"
                  value={filtros.utmCampaign ?? ""}
                  onChange={(e) => onChange({ ...filtros, utmCampaign: e.target.value || null })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Recebido a partir de</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dataDe && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataDe ? format(dataDe, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataDe}
                      onSelect={(d) => onChange({ ...filtros, periodoDe: paraIso(d) })}
                      locale={ptBR}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Recebido até</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dataAte && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataAte ? format(dataAte, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataAte}
                      onSelect={(d) => onChange({ ...filtros, periodoAte: paraIso(d) })}
                      locale={ptBR}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Chips dos filtros ativos */}
        {temFiltros && (
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/50">
            <span className="text-xs text-muted-foreground self-center mr-1">
              {filtrosAtivos.length} filtro(s) ativo(s):
            </span>
            {filtrosAtivos.map((f) => (
              <Badge key={f.chave} variant="secondary" className="gap-1 pr-1">
                <span className="text-xs">{f.label}</span>
                <button
                  type="button"
                  onClick={() => removerFiltro(f.chave)}
                  className="hover:bg-muted-foreground/20 rounded-sm p-0.5"
                  aria-label={`Remover ${f.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
