import { useState } from "react";
import { useCrmAnalytics, OpportunitySegment } from "@/hooks/useCrmAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Target, Zap, TrendingDown, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

const ICON_MAP: Record<string, any> = { Target, Zap, TrendingDown, Sparkles };

export default function CrmOpportunitiesPage() {
  const { opportunitySegments, isLoading } = useCrmAnalytics();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-[400px]" /></div>;
  }

  const totalOpportunities = opportunitySegments.reduce((s, seg) => s + seg.customers.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/crm")}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-6 w-6 text-green-500" /> Oportunidades de Engajamento
          </h2>
          <p className="text-sm text-muted-foreground">{totalOpportunities} oportunidades identificadas automaticamente</p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {opportunitySegments.map((seg) => {
          const Icon = ICON_MAP[seg.icon] || Target;
          return (
            <Card key={seg.key} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setExpanded(expanded === seg.key ? null : seg.key)}>
              <CardContent className="py-4">
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={`h-5 w-5 ${seg.color} shrink-0`} />
                  <p className={`text-2xl font-bold ${seg.color}`}>{seg.customers.length}</p>
                </div>
                <p className="text-sm font-medium">{seg.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-1">{seg.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {opportunitySegments.map((seg) => {
        if (expanded !== seg.key || seg.customers.length === 0) return null;
        const Icon = ICON_MAP[seg.icon] || Target;
        return (
          <Card key={seg.key}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${seg.color}`} /> {seg.label} ({seg.customers.length})
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setExpanded(null)}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Pontos</TableHead>
                    <TableHead>Pontuações</TableHead>
                    <TableHead>Resgates</TableHead>
                    <TableHead>Dias Inativo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seg.customers.slice(0, 20).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <p className="font-medium text-sm">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.phone || "—"}</p>
                      </TableCell>
                      <TableCell className="font-medium">{c.points_balance}</TableCell>
                      <TableCell>{c.total_earnings}</TableCell>
                      <TableCell>{c.total_redemptions}</TableCell>
                      <TableCell>{c.days_inactive}d</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {seg.customers.length > 20 && <p className="text-xs text-muted-foreground text-center py-2">+{seg.customers.length - 20} clientes</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
