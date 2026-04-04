import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPoints } from "@/lib/formatPoints";
import { Zap } from "lucide-react";
import type { FeedItem } from "./tipos_branch_dashboard";

interface Props {
  feed: FeedItem[];
}

export default function BranchFeedTempoReal({ feed }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> Pontuação em Tempo Real
          </CardTitle>
          <Badge variant="outline" className="gap-1.5 text-[10px] border-success/30 text-success">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-40 dot-pulse" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            Ao vivo
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {feed.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Aguardando novas pontuações...</p>
        ) : (
          <div className="divide-y divide-border max-h-[320px] overflow-y-auto">
            {feed.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.driver_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(item.finalized_at).toLocaleDateString("pt-BR", {
                      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 font-semibold border-primary/30 text-primary">
                  +{formatPoints(item.points)} pts
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
