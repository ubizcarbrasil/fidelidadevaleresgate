import { useRankingCidade } from "@/components/driver/duels/hook_ranking_cidade";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Medal } from "lucide-react";

interface Props {
  branchId: string;
}

const MEDAL_COLORS = ["text-amber-400", "text-slate-400", "text-orange-600"];

export default function RankingAdminView({ branchId }: Props) {
  const { data: ranking, isLoading } = useRankingCidade(branchId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          Ranking Mensal — Top 10
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : !ranking?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado de ranking encontrado.</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Apelido</TableHead>
                    <TableHead className="text-right">Corridas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranking.map((r) => (
                    <TableRow key={r.customerId}>
                      <TableCell>
                        {r.rankPosition <= 3 ? (
                          <Medal className={`h-4 w-4 ${MEDAL_COLORS[r.rankPosition - 1]}`} />
                        ) : (
                          <span className="text-sm text-muted-foreground">{r.rankPosition}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{r.driverName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.nickname || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{r.totalRides}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden space-y-2">
              {ranking.map((r) => (
                <div key={r.customerId} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="shrink-0 w-8 text-center">
                    {r.rankPosition <= 3 ? (
                      <Medal className={`h-5 w-5 mx-auto ${MEDAL_COLORS[r.rankPosition - 1]}`} />
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">{r.rankPosition}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.driverName}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.nickname || "Sem apelido"}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">{r.totalRides}</Badge>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
