import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import type { RankingTitulo } from "../types/tipos_hall_fama";

interface Props {
  ranking: RankingTitulo[];
}

export default function SecaoTitulosAcumulados({ ranking }: Props) {
  if (ranking.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        <h2 className="text-base font-bold">Títulos Acumulados</h2>
      </div>
      <Card>
        <CardContent className="p-0">
          <ol className="divide-y divide-border/60">
            {ranking.map((linha, idx) => (
              <li
                key={`${linha.driver_name}-${idx}`}
                className="flex items-center gap-3 px-4 py-2.5 text-sm"
              >
                <span className="w-6 text-center font-bold text-muted-foreground">
                  {idx + 1}
                </span>
                <span className="flex-1 truncate font-medium">
                  {linha.driver_name}
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                  🏆 {linha.title_count}{" "}
                  {linha.title_count === 1 ? "título" : "títulos"}
                </span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </section>
  );
}