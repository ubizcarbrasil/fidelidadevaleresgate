import { useCrmAnalytics } from "@/hooks/useCrmAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, UserPlus, TrendingUp, Crown, AlertTriangle, UserX, ArrowRight } from "lucide-react";

const STAGES = [
  { key: "new", label: "Novo", icon: UserPlus, color: "text-blue-500", bg: "bg-blue-500/10", borderColor: "border-blue-500/30" },
  { key: "engaging", label: "Engajando", icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10", borderColor: "border-green-500/30" },
  { key: "loyal", label: "Fiel", icon: Crown, color: "text-amber-500", bg: "bg-amber-500/10", borderColor: "border-amber-500/30" },
  { key: "at_risk", label: "Em Risco", icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10", borderColor: "border-orange-500/30" },
  { key: "lost", label: "Perdido", icon: UserX, color: "text-destructive", bg: "bg-destructive/10", borderColor: "border-destructive/30" },
] as const;

export default function CrmJourneyPage() {
  const { journeyStages, allCustomers, isLoading } = useCrmAnalytics();
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-[300px]" /></div>;
  }

  const total = allCustomers.length || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/crm")}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> Jornada do Cliente
          </h2>
          <p className="text-sm text-muted-foreground">Visualize o funil de engajamento da sua base</p>
        </div>
      </div>

      {/* Funnel visualization */}
      <div className="flex flex-col md:flex-row items-stretch gap-2 md:gap-0">
        {STAGES.map((stage, idx) => {
          const count = journeyStages[stage.key as keyof typeof journeyStages]?.length || 0;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={stage.key} className="flex items-center flex-1">
              <Card className={`flex-1 border-2 ${stage.borderColor} transition-all hover:scale-[1.02]`}>
                <CardContent className="py-5 text-center">
                  <div className={`h-12 w-12 rounded-xl ${stage.bg} flex items-center justify-center mx-auto mb-2`}>
                    <stage.icon className={`h-6 w-6 ${stage.color}`} />
                  </div>
                  <p className={`text-3xl font-extrabold ${stage.color}`}>{count}</p>
                  <p className="text-xs font-medium mt-1">{stage.label}</p>
                  <Badge variant="secondary" className="mt-2 text-[10px]">{pct}%</Badge>
                </CardContent>
              </Card>
              {idx < STAGES.length - 1 && (
                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 mx-1 hidden md:block" />
              )}
            </div>
          );
        })}
      </div>

      {/* Stage detail cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {STAGES.map((stage) => {
          const customers = journeyStages[stage.key as keyof typeof journeyStages] || [];
          if (customers.length === 0) return null;
          return (
            <Card key={stage.key} className={`border ${stage.borderColor}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <stage.icon className={`h-4 w-4 ${stage.color}`} /> {stage.label} ({customers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {customers.slice(0, 8).map((c) => (
                    <div key={c.id} className={`flex items-center justify-between rounded-lg ${stage.bg} px-3 py-2`}>
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {c.total_earnings} pts • {c.total_redemptions} resg • {c.days_inactive}d inativo
                        </p>
                      </div>
                    </div>
                  ))}
                  {customers.length > 8 && (
                    <p className="text-xs text-muted-foreground text-center">+{customers.length - 8} clientes</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
